'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, Send, X, Loader2, ImagePlus } from 'lucide-react';
import { ChatUnavailableError, getChatAvailable, sendChatMessage, sendChatPhoto, type ChatTurn, type ChatProductRef } from '@/lib/chatApi';
import { rememberDetails, rememberedDetails, type ChatOrder, type ChatOrderDetails } from '@/lib/chatOrder';
import { encodeCartLink } from '@/lib/cartLink';
import { fetchSharedCart } from '@/lib/checkoutApi';
import { setInstantHandoff } from '@/lib/instantCheckout';
import { refreshCustomerSession } from '@/lib/customerAuthApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { ChatOrderCard } from './ChatOrderCard';
import { formatPrice } from '../lib/formatPrice';
import { useCartDrawer } from '../lib/cartDrawer';
import { floatingHideTransform, useFloatingHidden } from '../lib/floatingScroll';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProductRef[];
  /** A photo the shopper sent (a local preview address; the photo itself never goes to the AI). */
  image?: string;
  /** When it was sent or received (ms). The greeting has none, so nothing differs between the server and the browser render. */
  at?: number;
}

/** "4:06 PM" for today, "11 Oct, 4:06 PM" for an earlier day, in the shopper's own time zone. */
function chatTime(at: number): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your shopping assistant. Ask me about any product — sizes, prices, or what's in stock. When you want something, tell me and I'll take your order here.",
};

/**
 * Floating "Assistant" icon (Store AI Chat Bot — see Super Admin > AI
 * Settings, which picks the Workers AI model this actually calls) —
 * stacked directly above the WhatsApp bubble at the same corner, same
 * convention as a typical storefront's "help" widgets clustering in one
 * spot rather than spreading floating buttons across the screen.
 * Shows only while the store's AI Credit wallet can pay for a reply
 * (ai-token-plan.md Step 5): it asks /chat/status on load and renders
 * nothing until that says yes. If the wallet runs out mid-chat, the open
 * panel says so politely and the bubble goes away once it's closed.
 * Shoppers are never told the store ran out of AI Credits.
 */
export function AiAssistantWidget({ subdomain, storeName }: { subdomain: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  // Ordering in the chat (lib/chatOrder.ts): one order for the whole chat, sent with every message, and the shopper's
  // details (from their saved address or this browser, else from the chat or typed in the card).
  const [order, setOrder] = useState<ChatOrder | null>(null);
  const [details, setDetails] = useState<ChatOrderDetails>({ name: '', phone: '', address: '', district: '' });
  const detailsLoaded = useRef(false);
  const [checkingOut, setCheckingOut] = useState(false);
  // Products the shopper's last photo matched (by picture fingerprint, no AI), sent with the next message so
  // "I'll take this one" works. Cleared once sent.
  const [photoSlugs, setPhotoSlugs] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File | undefined) => {
    if (!file || sending) return;
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setMessages((prev) => [...prev, { role: 'user', content: '', image: preview, at: Date.now() }]);
    setSending(true);
    try {
      const found = await sendChatPhoto(subdomain, file);
      setPhotoSlugs(found.map((p) => p.slug));
      setMessages((prev) => [
        ...prev,
        found.length
          ? { role: 'assistant', content: found.length === 1 ? 'This looks like our product below. Want it? Tell me the size, colour or how many.' : 'Your photo looks like one of these. Which one do you want?', products: found, at: Date.now() }
          : { role: 'assistant', content: "I couldn't find this exact product in our store. Please tell me what you are looking for (type, colour), and I'll check.", at: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err instanceof Error ? err.message : 'Could not read this photo.', at: Date.now() }]);
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const addLine = useCartStore((s) => s.addLine);
  const clearStore = useCartStore((s) => s.clearStore);

  // A logged-in shopper's token may be gone after a reload; take a fresh one before reading or saving their addresses.
  const token = async (): Promise<string | null> => {
    if (!customer) return null;
    if (accessToken) return accessToken;
    try {
      const session = await refreshCustomerSession();
      setSession(session.customer, session.accessToken);
      return session.accessToken;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!open || detailsLoaded.current) return;
    detailsLoaded.current = true;
    void (async () => {
      const known = await rememberedDetails(subdomain, await token());
      setDetails((d) => ({ name: d.name || known.name || '', phone: d.phone || known.phone || '', address: d.address || known.address || '', district: d.district || known.district || '' }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subdomain]);

  const checkout = async () => {
    if (!order || checkingOut) return;
    setCheckingOut(true);
    try {
      const code = encodeCartLink(order.items.map((i) => ({ productSlug: i.slug, quantity: i.quantity, selectedOptions: i.options })));
      const cart = await fetchSharedCart(subdomain, code);
      if (cart.status !== 'OK' || cart.lines.length === 0) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, these items are not available right now. Please choose another product.', at: Date.now() }]);
        return;
      }
      // The cart becomes this order (today's price and stock); the checkout opens with the details filled in.
      clearStore(subdomain);
      for (const l of cart.lines) {
        addLine({
          subdomain,
          storeName,
          productSlug: l.productSlug,
          name: l.name,
          image: l.image ?? undefined,
          unitPrice: l.unitPrice,
          originalUnitPrice: l.originalUnitPrice ?? undefined,
          quantity: l.quantity,
          selectedOptions: l.selectedOptions,
          isPreOrder: l.isPreOrder,
          minOrderQuantity: l.minOrderQuantity,
          quantityStep: l.quantityStep,
          productId: l.productId,
          variantId: l.variantId ?? undefined,
        });
      }
      const d = { name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim(), district: details.district.trim() };
      void rememberDetails(subdomain, d, await token());
      setInstantHandoff(subdomain, null, { fullName: d.name, phone: d.phone, address: d.address, city: '', district: d.district, zone: null });
      if (cart.notices.length) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Note: ${cart.notices.map((n) => n.name).join(', ')} could not be added as asked (stock changed).`, at: Date.now() }]);
      }
      setOpen(false);
      useCheckoutDialog.getState().openDialog();
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try Checkout again.', at: Date.now() }]);
    } finally {
      setCheckingOut(false);
    }
  };
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  // null while the status call is in flight; false hides the widget.
  const [available, setAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getChatAvailable(subdomain).then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    // A new answer is scrolled to its top, so the order card under it never hides what the assistant just said.
    const all = box.querySelectorAll<HTMLElement>('[data-chat-msg]');
    const last = all[all.length - 1];
    const lastIsAnswer = messages[messages.length - 1]?.role === 'assistant';
    const top = lastIsAnswer && last ? Math.min(last.offsetTop - 8, box.scrollHeight) : box.scrollHeight;
    box.scrollTo({ top, behavior: 'smooth' });
  }, [messages, open, order]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const history: ChatTurn[] = messages
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: text, at: Date.now() }]);
    setDraft('');
    setSending(true);
    try {
      const draftOrder = {
        items: (order?.items ?? []).map((i) => ({ slug: i.slug, quantity: i.quantity, options: i.options })),
        name: details.name.trim() || undefined,
        phone: details.phone.trim() || undefined,
        address: details.address.trim() || undefined,
        district: details.district.trim() || undefined,
      };
      const hasDraft = draftOrder.items.length > 0 || draftOrder.name || draftOrder.phone || draftOrder.address || draftOrder.district;
      const res = await sendChatMessage(subdomain, text, history, hasDraft ? draftOrder : null, photoSlugs);
      setPhotoSlugs([]);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, products: res.products, at: Date.now() }]);
      if (res.order) {
        const o = res.order;
        setOrder(o);
        // What the assistant read from this message fills the card.
        setDetails((d) => ({ name: o.name ?? d.name, phone: o.phone ?? d.phone, address: o.address ?? d.address, district: o.district ?? d.district }));
      }
    } catch (err) {
      if (err instanceof ChatUnavailableError) setAvailable(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong. Please try again.', at: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Both the bubble and the open panel step over to the left edge while the slide-in cart is open.
  const cartOpen = useCartDrawer((s) => s.open);
  // Slides off to the right while the shopper scrolls down, back on scroll up (never while the chat is open).
  const { hidden: scrolledAway, reveal } = useFloatingHidden(open || cartOpen);

  // Ran out mid-chat: keep the open panel (with its polite note) until the
  // shopper closes it, then hide the bubble too.
  if (available !== true && !open) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Chat with our assistant'}
        className="fixed bottom-[76px] right-5 z-30 w-12 h-12 rounded-full bg-accent hover:bg-accent-dark shadow-lg flex items-center justify-center transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none"
        onFocus={reveal}
        style={{
          transform: cartOpen
            ? 'translateX(calc(-100vw + 5.5rem))'
            : scrolledAway
              ? floatingHideTransform('right')
              : undefined,
        }}
      >
        {open ? <X size={22} className="text-white" /> : <Bot size={24} className="text-white" />}
      </button>

      {open && (
        <div
          className="fixed bottom-[136px] right-5 z-30 w-[min(360px,calc(100vw-2.5rem))] h-[min(480px,calc(100vh-180px))] bg-surface rounded-xl border border-line shadow-xl flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: cartOpen ? 'translateX(calc(-100vw + 2.5rem + min(360px, 100vw - 2.5rem)))' : undefined }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-ink text-white shrink-0">
            <Bot size={18} />
            <span className="text-[13.5px] font-semibold">Store Assistant</span>
          </div>

          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} data-chat-msg className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- the shopper's own photo, a local preview
                  <img src={m.image} alt="Your photo" className="max-w-[60%] max-h-40 rounded-lg border border-line object-cover" />
                ) : (
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                      m.role === 'user' ? 'bg-ink text-white' : 'bg-canvas text-ink border border-line'
                    }`}
                  >
                    {m.content}
                  </div>
                )}
                {m.at && <span className="mt-1 text-[10.5px] text-muted">{chatTime(m.at)}</span>}

                {m.products && m.products.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%]">
                    {m.products.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/store/${subdomain}/product/${p.slug}`}
                        className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2 hover:border-accent transition-colors"
                      >
                        <span className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-canvas">
                          {p.photoUrl && <Image src={p.photoUrl} alt={p.name} fill sizes="40px" className="object-cover" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[12px] font-medium text-ink truncate">{p.name}</span>
                          <span className="block text-[12px] font-bold text-accent">{formatPrice(p.price)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {order && <ChatOrderCard order={order} details={details} onDetails={setDetails} onCheckout={checkout} busy={checkingOut} />}
            {sending && (
              <div className="flex items-center gap-1.5 text-muted text-[12.5px]">
                <Loader2 size={13} className="animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-2.5 shrink-0">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sending || available === false}
              aria-label="Send a photo"
              title="Send a photo of the product"
              className="w-9 h-9 shrink-0 rounded-lg border border-line-strong text-ink flex items-center justify-center disabled:opacity-40 hover:border-accent transition-colors"
            >
              <ImagePlus size={16} />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              // A copied picture pasted with Ctrl+V is sent as a photo (like Claude); pasted text stays text.
              onPaste={(e) => {
                const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.kind === 'file' && i.type.startsWith('image/'));
                const file = item?.getAsFile();
                if (file) {
                  e.preventDefault();
                  void handlePhoto(file);
                }
              }}
              placeholder="Ask about a product or paste a photo…"
              disabled={sending || available === false}
              className="flex-1 px-3 py-2 rounded-lg border border-line-strong text-[13px] text-ink bg-surface outline-none focus:border-accent transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || available === false || !draft.trim()}
              aria-label="Send"
              className="w-9 h-9 shrink-0 rounded-lg bg-ink text-white flex items-center justify-center disabled:opacity-40 hover:bg-ink/90 transition-colors"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
