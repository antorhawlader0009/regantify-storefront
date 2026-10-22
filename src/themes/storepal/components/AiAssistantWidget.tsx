'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHeaderPresence } from '../lib/headerPresence';
import Image from 'next/image';
import { Bot, Send, X, Loader2, ImagePlus, Check, History, SquarePen, Trash2, Phone } from 'lucide-react';
import {
  ChatUnavailableError,
  getChatStatus,
  sendChatMessage,
  sendChatPhoto,
  type ChatPageContext,
  type ChatReply,
  type ChatTurn,
  type ChatProductRef,
  type PhotoTextMode,
} from '@/lib/chatApi';
import { lineId } from '@/stores/cart-store';
import type { SharedCart } from '@/lib/checkoutApi';

type SharedLine = Extract<SharedCart, { status: 'OK' }>['lines'][number];
import { useVoiceCall } from '@/lib/voice/useVoiceCall';
import { voiceCallSupported } from '@/lib/voice/speechInput';
import { VoiceCallScreen } from '@/components/voice/VoiceCallScreen';
import { readPhotoText } from '@/lib/photoText';
import { rememberDetails, rememberedDetails, type ChatOrder, type ChatOrderDetails } from '@/lib/chatOrder';
import { encodeCartLink } from '@/lib/cartLink';
import { fetchSharedCart } from '@/lib/checkoutApi';
import { setInstantHandoff } from '@/lib/instantCheckout';
import { refreshCustomerSession } from '@/lib/customerAuthApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { useAssistantBridge } from '../lib/assistantBridge';
import {
  ago,
  currentChatId,
  deleteChat,
  loadChats,
  newChatId,
  photoThumbnail,
  rememberOpen,
  saveChat,
  setCurrentChatId,
  wasOpen,
  type StoredChat,
} from '../lib/chatHistory';
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
  /** The cards the shopper ticked when sending this message ("1. Cotton Panjabi"), shown under it. */
  picks?: string[];
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
  // The chat speaks Bangla in Bangla script (the server's prompt does the same for the AI), unless the shopper asks for English.
  content: 'হ্যালো! আমি আপনার শপিং অ্যাসিস্ট্যান্ট। যেকোনো পণ্যের সাইজ, দাম বা স্টক সম্পর্কে জিজ্ঞেস করুন। কিছু কিনতে চাইলে বলুন, এখানেই অর্ডার নিয়ে নেব।',
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
  // The text in that photo (lib/photoText.ts in the browser, or read by the server: Super Admin's choice, from
  // /chat/status), also sent with the next message so the AI can use a screenshot's name, price or size. A promise,
  // because reading in the browser can finish after the shopper starts typing.
  const photoTextRef = useRef<Promise<string | null> | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoTextMode>('BROWSER');
  // The voice call (lib/voice): its files' folder on R2 (from /chat/status), and whether this browser can do it at all.
  const [voiceBase, setVoiceBase] = useState<string | null>(null);
  const [canCall, setCanCall] = useState(false);
  useEffect(() => setCanCall(voiceCallSupported()), []);
  // Cards the shopper ticked: which message's cards, and which slugs. Sent with the next message (numbered, like on
  // screen) so the assistant knows exactly which products are meant.
  const [selection, setSelection] = useState<{ msg: number; slugs: string[] } | null>(null);
  const toggleCard = (msg: number, slug: string) =>
    setSelection((cur) => {
      const slugs = cur && cur.msg === msg ? cur.slugs : [];
      const next = slugs.includes(slug) ? slugs.filter((x) => x !== slug) : [...slugs, slug];
      return next.length ? { msg, slugs: next } : null;
    });
  const fileRef = useRef<HTMLInputElement>(null);

  // Returns the products the photo matched (the voice call says them; the chat shows them as cards either way).
  // `fromCall`: the voice call's camera, which may send while a spoken turn's answer is still on its way.
  const handlePhoto = async (file: File | undefined, fromCall = false): Promise<ChatProductRef[]> => {
    if (!file || (sending && !fromCall)) return [];
    if (!file.type.startsWith('image/')) return [];
    // A small thumbnail (not a blob address), so the photo is still there when the chat is reopened.
    const preview = await photoThumbnail(file).catch(() => URL.createObjectURL(file));
    setMessages((prev) => [...prev, { role: 'user', content: '', image: preview, at: Date.now() }]);
    setSending(true);
    // Browser mode: the text is read here while the server matches the picture.
    const browserText = photoMode === 'BROWSER' ? readPhotoText(file) : null;
    photoTextRef.current = browserText;
    try {
      const { products: found, text } = await sendChatPhoto(subdomain, file, photoMode);
      if (photoMode === 'SERVER') photoTextRef.current = Promise.resolve(text);
      setPhotoSlugs(found.map((p) => p.slug));
      setMessages((prev) => [
        ...prev,
        found.length
          ? { role: 'assistant', content: found.length === 1 ? 'মনে হচ্ছে নিচের পণ্যটিই। নিতে চাইলে সাইজ, রং বা কয়টি লাগবে বলুন।' : 'আপনার ছবিটি এগুলোর কোনো একটির মতো। কোনটি চান?', products: found, at: Date.now() }
          : text
            ? { role: 'assistant', content: 'ছবিটি আমাদের কোনো পণ্যের সাথে মেলেনি, তবে ছবির লেখাটা পড়তে পেরেছি। কী খুঁজছেন বলুন, আমি দেখছি।', at: Date.now() }
            : { role: 'assistant', content: 'হুবহু এই পণ্যটি আমাদের দোকানে পাইনি। কী খুঁজছেন (ধরন, রং) বলুন, আমি দেখছি।', at: Date.now() },
      ]);
      return found;
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err instanceof Error ? err.message : 'ছবিটি পড়া যায়নি।', at: Date.now() }]);
      return [];
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
  const removeLine = useCartStore((s) => s.removeLine);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartLines = useCartStore((s) => s.lines);
  const myLines = cartLines.filter((l) => l.subdomain === subdomain);
  /** A line priced by the server today (shared-cart route), put into the cart. */
  const addShared = (l: SharedLine) =>
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

  // Where the shopper is, sent with every message: the product page open now ("eita") and the cart ("cart e ki ache").
  const pathname = usePathname();
  const pageContext = (): ChatPageContext => {
    const open = pathname?.match(/\/(?:product|p)\/([^/?#]+)/);
    return {
      productSlug: open ? decodeURIComponent(open[1]) : undefined,
      cart: myLines.slice(0, 20).map((l) => ({
        slug: l.productSlug,
        quantity: Math.min(999, Math.max(1, l.quantity)),
        options: Object.keys(l.selectedOptions).length ? l.selectedOptions : undefined,
      })),
    };
  };

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
        setMessages((prev) => [...prev, { role: 'assistant', content: 'দুঃখিত, এই পণ্যগুলো এখন পাওয়া যাচ্ছে না। অন্য একটি পণ্য বেছে নিন।', at: Date.now() }]);
        return;
      }
      // The cart becomes this order (today's price and stock); the checkout opens with the details filled in.
      clearStore(subdomain);
      for (const l of cart.lines) addShared(l);
      const d = { name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim(), district: details.district.trim() };
      void rememberDetails(subdomain, d, await token());
      setInstantHandoff(subdomain, null, { fullName: d.name, phone: d.phone, address: d.address, city: '', district: d.district, zone: null });
      if (cart.notices.length) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `খেয়াল করুন: ${cart.notices.map((n) => n.name).join(', ')} যেভাবে চেয়েছিলেন সেভাবে যোগ করা যায়নি (স্টক বদলেছে)।`, at: Date.now() }]);
      }
      setOpen(false);
      useCheckoutDialog.getState().openDialog();
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'কিছু একটা সমস্যা হয়েছে। আবার চেকআউট চাপুন।', at: Date.now() }]);
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

  // Saved chats (lib/chatHistory.ts), like the dashboard's Ask AI: the last 10 per store in this browser, and the chat in
  // use plus the panel's open state per tab, so opening a product never loses the conversation.
  const [chatId, setChatId] = useState(() => newChatId());
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState<StoredChat[]>([]);
  const restored = useRef(false);
  // What was last saved, so reopening a chat (no change) doesn't move it to the top of the list.
  const lastSaved = useRef('');
  const loadChat = (c: StoredChat) => {
    lastSaved.current = JSON.stringify([c.messages, c.order]);
    setChatId(c.id);
    setMessages([GREETING, ...c.messages]);
    setOrder(c.order);
    setSelection(null);
    setPhotoSlugs([]);
    photoTextRef.current = null;
  };
  useEffect(() => {
    const id = currentChatId(subdomain);
    const saved = id ? loadChats(subdomain).find((c) => c.id === id) : undefined;
    if (saved) loadChat(saved);
    if (wasOpen(subdomain)) setOpen(true);
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);
  useEffect(() => {
    if (!restored.current) return;
    const kept = messages.filter((m) => m !== GREETING);
    if (!kept.some((m) => m.role === 'user')) return;
    const snapshot = JSON.stringify([kept, order]);
    if (snapshot === lastSaved.current) return;
    lastSaved.current = snapshot;
    saveChat(subdomain, { id: chatId, updatedAt: Date.now(), messages: kept, order });
    setCurrentChatId(subdomain, chatId);
  }, [messages, order, chatId, subdomain]);
  useEffect(() => {
    if (restored.current) rememberOpen(subdomain, open);
  }, [open, subdomain]);
  const startNewChat = () => {
    setChatId(newChatId());
    setMessages([GREETING]);
    setOrder(null);
    setSelection(null);
    setPhotoSlugs([]);
    photoTextRef.current = null;
    setShowHistory(false);
    setCurrentChatId(subdomain, null);
  };
  const toggleHistory = () => {
    setChats(loadChats(subdomain));
    setShowHistory((v) => !v);
  };
  // A product opened from the chat: on a phone the chat steps aside (the conversation stays and comes back when the
  // bubble is tapped); on a computer it stays open next to the product page.
  const onProductOpen = () => {
    if (window.matchMedia('(max-width: 639px)').matches) setOpen(false);
  };

  // Questions handed over by the store (lib/assistantBridge.ts): the chat opens and sends it once it can answer.
  const setBridgeAvailable = useAssistantBridge((s) => s.setAvailable);
  const pendingQuestion = useAssistantBridge((s) => s.pending);
  useEffect(() => {
    if (!pendingQuestion || available !== true || sending) return;
    const q = useAssistantBridge.getState().take();
    if (!q) return;
    setOpen(true);
    void handleSend(undefined, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion, available, sending]);

  useEffect(() => {
    let cancelled = false;
    getChatStatus(subdomain).then((status) => {
      if (cancelled) return;
      setAvailable(status.available);
      setBridgeAvailable(status.available);
      setPhotoMode(status.photoText);
      setVoiceBase(status.voice);
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  // The chat stays at the bottom, like a messaging app (the user's rule, 2026-10-21): on a new message, while "thinking",
  // when the panel opens or a past chat is reopened, and while pictures in it finish loading. Only when the shopper has
  // scrolled up to read does it stay where they are, until the next message.
  const stickToBottom = useRef(true);
  const toBottom = (smooth: boolean) => {
    const box = scrollRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };
  const lastCount = useRef(0);
  useEffect(() => {
    if (!open || showHistory) return;
    const added = messages.length !== lastCount.current;
    lastCount.current = messages.length;
    if (added) stickToBottom.current = true;
    if (stickToBottom.current) requestAnimationFrame(() => toBottom(added));
  }, [messages, open, order, sending, showHistory]);
  useEffect(() => {
    const box = scrollRef.current;
    if (!open || !box) return;
    const onScroll = () => {
      stickToBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    };
    // Pictures (product photos, the shopper's photo) load after the text and make the chat taller.
    const onLoad = () => stickToBottom.current && toBottom(false);
    const grow = new ResizeObserver(() => stickToBottom.current && toBottom(false));
    for (const child of Array.from(box.children)) grow.observe(child);
    box.addEventListener('scroll', onScroll, { passive: true });
    box.addEventListener('load', onLoad, true);
    return () => {
      grow.disconnect();
      box.removeEventListener('scroll', onScroll);
      box.removeEventListener('load', onLoad, true);
    };
  }, [open, messages, order, showHistory]);

  // `asked`: a question handed over by another part of the store (a search that found nothing, lib/assistantBridge.ts);
  // the shopper's own unsent text in the box is left alone then.
  // `voice`: a turn of the voice call (useVoiceCall): sent even while an earlier reply is still on its way, the reply is
  // returned to be spoken, and a failure is thrown to the call instead of written into the chat.
  const handleSend = async (e?: React.FormEvent, asked?: string, voice?: { signal: AbortSignal }): Promise<ChatReply | null> => {
    e?.preventDefault();
    const ticked = selection?.slugs ?? [];
    // Ticked cards can be sent without typing anything.
    const text = (asked ?? draft).trim() || (ticked.length ? (ticked.length === 1 ? 'আমি এটা নিতে চাই।' : 'আমি এগুলো নিতে চাই।') : '');
    if (!text || (sending && !voice)) return null;

    // The cards meant: the message whose cards were ticked, else the latest message with cards.
    let cardMsg = selection?.msg ?? -1;
    if (cardMsg < 0) for (let i = messages.length - 1; i >= 0; i--) if (messages[i].products?.length) { cardMsg = i; break; }
    const shown = cardMsg >= 0 ? (messages[cardMsg].products ?? []) : [];
    const shownSlugs = shown.map((p) => p.slug);
    const picks = ticked
      .map((slug) => shown.findIndex((p) => p.slug === slug))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)
      .map((i) => `${i + 1}. ${shown[i].name}`);

    const history: ChatTurn[] = messages
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.picks?.length ? `${m.content} (ticked: ${m.picks.join(', ')})` : m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: text, picks: picks.length ? picks : undefined, at: Date.now() }]);
    setSelection(null);
    if (asked === undefined) setDraft('');
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
      // The last photo's text, waited for a few seconds at most (the first browser read also loads the reader).
      const pendingText = photoTextRef.current;
      photoTextRef.current = null;
      const photoText = pendingText
        ? await Promise.race([pendingText, new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))])
        : null;
      const res = await sendChatMessage(subdomain, text, history, hasDraft ? draftOrder : null, photoSlugs, photoText, {
        shownSlugs,
        selectedSlugs: ticked,
        voice: !!voice,
        signal: voice?.signal,
        context: pageContext(),
      });
      setPhotoSlugs([]);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, products: res.products, at: Date.now() }]);
      if (res.order) {
        const o = res.order;
        setOrder(o);
        // What the assistant read from this message fills the card.
        setDetails((d) => ({ name: o.name ?? d.name, phone: o.phone ?? d.phone, address: o.address ?? d.address, district: o.district ?? d.district }));
        // On a call the assistant's choices go straight into the cart (it never places the order itself).
        if (voice) void syncCallCart(o);
      }
      return res;
    } catch (err) {
      if (err instanceof ChatUnavailableError) {
        setAvailable(false);
        setBridgeAvailable(false);
      }
      if (voice) throw err;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।', at: Date.now() },
      ]);
      return null;
    } finally {
      setSending(false);
    }
  };

  // The voice call (lib/voice/useVoiceCall.ts): every spoken turn goes through handleSend, so it is kept in this chat
  // (with its product cards and the order card) and the assistant sees the whole conversation, typed or spoken.
  const router = useRouter();
  // The cart as it is now, for the call's "কার্ট দেখাও" line (the call's callbacks outlive a render).
  const myLinesRef = useRef(myLines);
  myLinesRef.current = myLines;
  const sendRef = useRef(handleSend);
  sendRef.current = handleSend;
  const photoRef = useRef(handlePhoto);
  photoRef.current = handlePhoto;
  const call = useVoiceCall<ChatProductRef>({
    base: voiceBase,
    storeName,
    send: async (text, signal) => {
      const res = await sendRef.current(undefined, text, { signal });
      if (!res) throw new Error('no reply');
      return { reply: res.reply, products: res.products, actions: res.actions };
    },
    onGreeting: (greeting) => setMessages((prev) => [...prev, { role: 'assistant', content: greeting, at: Date.now() }]),
    // "ছবি দিয়ে খুঁজতে চাই": the call's camera photo goes through the chat's own free picture match (kept in the chat too).
    photoSearch: async (file) => {
      const found = await photoRef.current(file, true);
      return { products: found, names: found.map((p) => p.name) };
    },
    // "পণ্যটা খুলে দেখাও": the page opens in this tab; the call goes on (this widget lives in the store layout).
    onOpenProduct: (slug) => router.push(`/store/${subdomain}/product/${slug}`),
    // "X khuje dekhao": the store's own search results page; "back jao": the browser's Back.
    navigate: {
      search: (query) => router.push(`/store/${subdomain}?q=${encodeURIComponent(query)}`),
      back: () => router.back(),
    },
    // "কার্ট দেখাও" / "কার্ট বন্ধ করো": the same slide-in cart the header's bag icon opens.
    cart: {
      isOpen: () => useCartDrawer.getState().open,
      show: (open) => {
        if (!open) {
          useCartDrawer.getState().closeDrawer();
          return 'ঠিক আছে, কার্ট বন্ধ করে দিলাম। আর কিছু লাগবে?';
        }
        useCartDrawer.getState().openDrawer();
        const lines = myLinesRef.current;
        if (!lines.length) return 'আপনার কার্ট খুলে দিলাম, এখন কার্টটা খালি। কিছু পছন্দ হলে বলুন, যোগ করে দেব।';
        const count = lines.reduce((n, l) => n + l.quantity, 0);
        const total = Math.round(lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0));
        return `এই যে আপনার কার্ট। ${count}টা পণ্য আছে, মোট ৳${total}। অর্ডার করতে চাইলে কার্টের বাটনে চাপুন।`;
      },
    },
  });
  // The chat steps aside during the call and comes back after it, showing what was said (not after "confirm order",
  // which opens the checkout instead).
  const reopenAfterCall = useRef(false);
  // Lines the call put in the cart (line id -> quantity it set): it only changes or removes its own lines, never what
  // the shopper had there before. Priced by the server today (shared-cart route), like every other way into the cart.
  const callLinesRef = useRef(new Map<string, number>());
  const syncCallCart = async (o: ChatOrder) => {
    const ready = o.items.filter((i) => i.missingOptions.length === 0);
    const wanted = new Map(ready.map((i) => [lineId(i.slug, i.options), i]));
    for (const id of [...callLinesRef.current.keys()]) {
      if (!wanted.has(id)) {
        removeLine(id);
        callLinesRef.current.delete(id);
      }
    }
    const toAdd = [];
    for (const [id, item] of wanted) {
      const line = myLines.find((l) => l.id === id);
      if (!line) toAdd.push(item);
      else if (callLinesRef.current.has(id) && line.quantity !== item.quantity) {
        setQuantity(id, item.quantity);
        callLinesRef.current.set(id, item.quantity);
      }
    }
    if (!toAdd.length) return;
    try {
      const cart = await fetchSharedCart(subdomain, encodeCartLink(toAdd.map((i) => ({ productSlug: i.slug, quantity: i.quantity, selectedOptions: i.options }))));
      if (cart.status !== 'OK') return;
      for (const l of cart.lines) {
        addShared(l);
        callLinesRef.current.set(lineId(l.productSlug, l.selectedOptions), l.quantity);
      }
    } catch {
      /* the order card in the chat still has it */
    }
  };
  const startCall = () => {
    callLinesRef.current = new Map();
    reopenAfterCall.current = true;
    setShowHistory(false);
    setOpen(false);
    void call.start();
  };
  useEffect(() => {
    if (call.phase === 'idle' && reopenAfterCall.current) {
      reopenAfterCall.current = false;
      setOpen(true);
    }
  }, [call.phase]);
  // The shopper's own tap: the call ends and the checkout opens with the cart the call filled and the details it took.
  // The assistant itself never opens it (the user's rule, 2026-10-22).
  const checkoutFromCall = () => {
    reopenAfterCall.current = false;
    call.hangUp();
    const d = { name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim(), district: details.district.trim() };
    setInstantHandoff(subdomain, null, { fullName: d.name, phone: d.phone, address: d.address, city: '', district: d.district, zone: null });
    void token().then((t) => rememberDetails(subdomain, d, t));
    useCheckoutDialog.getState().openDialog();
  };
  const cartSummary = myLines.length
    ? { count: myLines.reduce((n, l) => n + l.quantity, 0), total: myLines.reduce((n, l) => n + l.unitPrice * l.quantity, 0) }
    : null;
  const voiceCallScreen = (
    <VoiceCallScreen
      call={call}
      storeName={storeName}
      productHref={(slug) => `/store/${subdomain}/product/${slug}`}
      cart={cartSummary}
      checkout={order?.ready && myLines.length ? { onClick: checkoutFromCall, busy: false } : null}
    />
  );

  // Both the bubble and the open panel step over to the left edge while the slide-in cart is open.
  const cartOpen = useCartDrawer((s) => s.open);
  // Slides off to the right while the shopper scrolls down, back on scroll up (never while the chat is open).
  const { hidden: scrolledAway, reveal } = useFloatingHidden(open || cartOpen);
  // Mounted once in the store layout: shown only on pages that have the store header (headerPresence.ts).
  const headerHere = useHeaderPresence((s) => s.count > 0);

  // Ran out mid-chat: keep the open panel (with its polite note) until the
  // shopper closes it, then hide the bubble too.
  // A call in progress stays on screen even if the wallet ran out during it, or on a page without the store header.
  if (call.phase === 'idle' && !headerHere) return null;
  if (available !== true && !open) return call.phase === 'idle' ? null : voiceCallScreen;
  if (!headerHere) return voiceCallScreen;

  return (
    <>
      {voiceCallScreen}
      {/* The round bubble only opens the chat; while it is open, the close button is in the panel's header. */}
      {!open && call.phase === 'idle' && (
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with our assistant"
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
        <Bot size={24} className="text-white" />
      </button>
      )}

      {open && (
        <div
          className="fixed bottom-[76px] right-5 z-30 w-[min(360px,calc(100vw-2.5rem))] h-[min(480px,calc(100vh-120px))] bg-surface rounded-xl border border-line shadow-xl flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: cartOpen ? 'translateX(calc(-100vw + 2.5rem + min(360px, 100vw - 2.5rem)))' : undefined }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-ink text-white shrink-0">
            <Bot size={18} />
            <span className="flex-1 text-[13.5px] font-semibold">শপিং অ্যাসিস্ট্যান্ট</span>
            {canCall && available === true && (
              <button
                type="button"
                onClick={startCall}
                aria-label="Voice call the assistant"
                title="কল করে কথা বলুন"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Phone size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={toggleHistory}
              aria-pressed={showHistory}
              aria-label="Past chats"
              title="আগের চ্যাট"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showHistory ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <History size={16} />
            </button>
            <button type="button" onClick={startNewChat} aria-label="New chat" title="নতুন চ্যাট" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <SquarePen size={16} />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" title="বন্ধ করুন" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>
          {showHistory && (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted">আগের চ্যাট</p>
              {chats.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12.5px] text-muted">এখনো কোনো চ্যাট রাখা নেই।</p>
              ) : (
                chats.map((c) => (
                  <div key={c.id} className={`group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-canvas ${c.id === chatId ? 'bg-canvas' : ''}`}>
                    <button
                      type="button"
                      onClick={() => {
                        loadChat(c);
                        setCurrentChatId(subdomain, c.id);
                        setShowHistory(false);
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="block text-[13px] text-ink truncate">{c.title}</span>
                      <span className="block text-[11px] text-muted">
                        {ago(c.updatedAt)} · {c.messages.length}টি মেসেজ
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteChat(subdomain, c.id);
                        setChats(loadChats(subdomain));
                        if (c.id === chatId) startNewChat();
                      }}
                      aria-label={`Delete chat ${c.title}`}
                      className="w-7 h-7 shrink-0 rounded-md text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div ref={scrollRef} className={`relative flex-1 overflow-y-auto px-3 py-3 flex-col gap-3 ${showHistory ? 'hidden' : 'flex'}`}>
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
                    {m.picks && <span className="block mt-1 text-[11.5px] opacity-80">✓ {m.picks.join(', ')}</span>}
                  </div>
                )}
                {m.at && <span className="mt-1 text-[10.5px] text-muted">{chatTime(m.at)}</span>}

                {m.products && m.products.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%]">
                    {m.products.map((p, n) => {
                      const on = selection?.msg === i && selection.slugs.includes(p.slug);
                      return (
                        <div
                          key={p.slug}
                          className={`flex items-center gap-2 rounded-lg border bg-surface p-2 transition-colors ${on ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-accent'}`}
                        >
                          <span className="w-5 h-5 shrink-0 rounded-full bg-ink/80 text-white text-[11px] font-bold flex items-center justify-center" aria-hidden>
                            {n + 1}
                          </span>
                          <Link href={`/store/${subdomain}/product/${p.slug}`} onClick={onProductOpen} className="flex flex-1 min-w-0 items-center gap-2.5">
                            <span className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-canvas">
                              {p.photoUrl && <Image src={p.photoUrl} alt={p.name} fill sizes="40px" className="object-cover" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[12px] font-medium text-ink truncate">{p.name}</span>
                              <span className="block text-[12px] font-bold text-accent">{formatPrice(p.price)}</span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleCard(i, p.slug)}
                            aria-pressed={on}
                            aria-label={on ? `Untick ${n + 1}. ${p.name}` : `Select ${n + 1}. ${p.name}`}
                            title={on ? 'বাছাই করা হয়েছে' : 'এটি বাছাই করুন'}
                            className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${on ? 'bg-accent border-accent text-white' : 'border-line-strong text-transparent hover:border-accent'}`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {canCall && available === true && messages.length === 1 && !sending && (
              <button
                type="button"
                onClick={startCall}
                className="self-start inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-[12.5px] font-medium text-accent hover:bg-accent hover:text-white transition-colors"
              >
                <Phone size={13} />
                লিখতে না চাইলে কল করে কথা বলুন
              </button>
            )}
            {order && <ChatOrderCard order={order} details={details} onDetails={setDetails} onCheckout={checkout} busy={checkingOut} />}
            {sending && (
              <div className="flex items-center gap-1.5 text-muted text-[12.5px]">
                <Loader2 size={13} className="animate-spin" />
                ভাবছি…
              </div>
            )}
          </div>

          {selection && !showHistory && (
            <div className="flex items-center gap-2 border-t border-line bg-canvas px-3 py-2 text-[12px] text-ink shrink-0">
              <Check size={14} className="text-accent shrink-0" />
              <span className="flex-1 min-w-0 truncate">
                বাছাই করা:{' '}
                {(messages[selection.msg]?.products ?? [])
                  .map((p, n) => (selection.slugs.includes(p.slug) ? `${n + 1}. ${p.name}` : null))
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <button type="button" onClick={() => setSelection(null)} className="text-muted hover:text-ink" aria-label="Clear selection">
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-2.5 shrink-0">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sending || available === false}
              aria-label="Send a photo"
              title="পণ্যের ছবি পাঠান"
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
              placeholder="পণ্য সম্পর্কে জিজ্ঞেস করুন বা ছবি দিন…"
              disabled={sending || available === false}
              className="flex-1 px-3 py-2 rounded-lg border border-line-strong text-[13px] text-ink bg-surface outline-none focus:border-accent transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || available === false || (!draft.trim() && !selection)}
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
