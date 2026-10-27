'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHeaderPresence } from '../lib/headerPresence';
import Image from 'next/image';
import { MessageCircle, Send, X, ImagePlus, Mic, Check, History, SquarePen, Trash2, Phone, Minimize2, Maximize2 } from 'lucide-react';
import {
  ChatUnavailableError,
  getChatStatus,
  sendChatMessage,
  sendChatPhoto,
  type ChatLive,
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
import { prefetchVoice } from '@/lib/voice/voicePrefetch';
import { VoiceCallScreen } from '@/components/voice/VoiceCallScreen';
import { readPhotoText } from '@/lib/photoText';
import { usePhotoSearch } from '@/lib/photoSearch';
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
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { useCartDrawer } from '../lib/cartDrawer';
import { floatingHideTransform, useFloatingHidden } from '../lib/floatingScroll';
import { useFormatPrice } from '../lib/storeText';
import { trackFeature } from '@/lib/featureUse';
import { useVoiceSearch } from '@/lib/voiceSearch';

/** sessionStorage: '1' when the shopper shrank the phone chat to the corner panel. */
const COMPACT_KEY = 'storepal-chat-compact';

/** The header's quiet icon buttons (the store's colour is kept for the shopper's own words and the send button). */
const HEADER_BUTTON =
  'w-9 h-9 shrink-0 rounded-full text-muted flex items-center justify-center transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent';

/** Soft depth for the white surfaces on the grey thread (bubbles, product list, message box): a close line plus a wide, faint lift. */
const SOFT_SHADOW = 'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_4px_14px_-4px_rgba(16,24,40,0.10)]';

/**
 * The chat's background, WhatsApp style: a faint tile of hand-drawn shop doodles (bag, tag, cart, gift, heart, star,
 * parcel, truck, discount, chat, sparkle). Our own drawing, used as a mask over the store's accent colour so every store
 * gets it in its own colour.
 */
const DOODLE_ICONS: Array<[number, number, number, string]> = [
  [14, 14, -12, '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'],
  [96, 8, 15, '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.5"/>'],
  [172, 20, -8, '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'],
  [44, 74, 10, '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9S10 4 7.5 5.5 9 9 12 9zm0 0s2-5 4.5-3.5S15 9 12 9z"/>'],
  [126, 66, -14, '<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'],
  [200, 92, 18, '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'],
  [12, 146, -10, '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/>'],
  [98, 136, 8, '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'],
  [176, 158, 12, '<path d="M12 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7z"/>'],
  [56, 200, -6, '<path d="M4 5h16v11H9l-5 4z"/>'],
  [142, 204, 10, '<path d="M2 6h11v10H2zM13 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'],
];
const DOODLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">' +
  '<g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
  DOODLE_ICONS.map(([x, y, r, d]) => `<g transform="translate(${x} ${y}) rotate(${r} 12 12)">${d}</g>`).join('') +
  '</g><g fill="#000"><circle cx="84" cy="52" r="1.6"/><circle cx="214" cy="54" r="1.6"/><circle cx="160" cy="118" r="1.6"/>' +
  '<circle cx="34" cy="122" r="1.6"/><circle cx="120" cy="186" r="1.6"/><circle cx="22" cy="226" r="1.6"/><circle cx="222" cy="226" r="1.6"/></g></svg>';
const DOODLE_URL = `url("data:image/svg+xml,${encodeURIComponent(DOODLE_SVG)}")`;
const DOODLE_STYLE: React.CSSProperties = {
  maskImage: DOODLE_URL,
  WebkitMaskImage: DOODLE_URL,
  maskSize: '200px 200px',
  WebkitMaskSize: '200px 200px',
  maskRepeat: 'repeat',
  WebkitMaskRepeat: 'repeat',
};

/** A CSS mask from one SVG tile (drawn in black; the layer's colour shows through it). */
function svgMask(svg: string, size: string): React.CSSProperties {
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { maskImage: url, WebkitMaskImage: url, maskSize: size, WebkitMaskSize: size, maskRepeat: 'repeat', WebkitMaskRepeat: 'repeat' };
}

/**
 * The header's background: a crisp line drawing (no gradient, no blur) of a little shopping street along the header's
 * bottom edge: two shops with scalloped awnings, a small house-shop and a tree, on a ground line. Kept at its own
 * proportions and anchored bottom-right, so it never stretches.
 */
const HEADER_STREET_STYLE: React.CSSProperties = {
  ...svgMask(
    '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="64" viewBox="0 0 250 64">' +
      '<g fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M0 62h250"/>' +
      // Shop with an awning, a sign, a window and a door.
      '<path d="M8 62V28h48v34"/><path d="M4 28h56l-4 8H8z"/><path d="M8 36q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0q4 4 8 0"/>' +
      '<rect x="18" y="18" width="28" height="8" rx="1"/><rect x="13" y="44" width="12" height="10"/><path d="M34 62V46h12v16"/>' +
      // Small house-shop with a pitched roof.
      '<path d="M70 62V36l25-17 25 17v26"/><path d="M66 38l29-20 29 20"/><rect x="79" y="42" width="11" height="9"/><path d="M100 62V48h11v14"/>' +
      // Second awning shop.
      '<path d="M134 62V26h56v36"/><path d="M130 26h64l-5 8h-54z"/><path d="M135 34q4.5 4 9 0q4.5 4 9 0q4.5 4 9 0q4.5 4 9 0q4.5 4 9 0q4.5 4 9 0"/>' +
      '<rect x="142" y="42" width="18" height="12"/><path d="M151 42v12M142 48h18"/><path d="M170 62V45h12v17"/>' +
      // Tree.
      '<circle cx="216" cy="38" r="11"/><path d="M216 49v13M216 54l-4-4M216 56l4-4"/>' +
      '</g></svg>',
    'auto 100%',
  ),
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'right bottom',
  WebkitMaskPosition: 'right bottom',
};

/**
 * The message box's background: the same crisp line style as the header's street, now the delivery side: a van with
 * motion lines, a stack of parcels, a shopping bag and a small cloud, on a ground line. Anchored bottom-left (the header's
 * drawing sits on the right), at its own proportions.
 */
const FOOTER_DELIVERY_STYLE: React.CSSProperties = {
  ...svgMask(
    '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="64" viewBox="0 0 250 64">' +
      '<g fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M0 62h250"/>' +
      // Motion lines and the delivery van with a parcel on its side.
      '<path d="M4 38h8M2 44h10M6 50h6"/>' +
      '<path d="M16 56V32h46v24"/><path d="M62 38h16l10 10v8H62"/><path d="M66 41h10l6 6H66z"/>' +
      '<rect x="28" y="38" width="16" height="11"/><path d="M36 38v11"/>' +
      '<circle cx="31" cy="57" r="5"/><circle cx="75" cy="57" r="5"/><path d="M36 56h34"/>' +
      // Stack of parcels.
      '<rect x="112" y="42" width="20" height="20"/><path d="M122 42v6"/><rect x="134" y="48" width="16" height="14"/><path d="M142 48v5"/>' +
      '<rect x="117" y="28" width="15" height="14"/><path d="M124.5 28v5"/>' +
      // Shopping bag.
      '<path d="M170 62V40h24v22z"/><path d="M175 40v-4a7 7 0 0 1 14 0v4"/>' +
      // Small cloud.
      '<path d="M212 30h22a6 6 0 0 0-2-11.7 8 8 0 0 0-15.4-1.3A6.5 6.5 0 0 0 212 30z"/>' +
      '</g></svg>',
    'auto 18px',
  ),
  // A thin strip along the bottom edge, behind the disclaimer line (no extra height), repeated sideways.
  maskRepeat: 'repeat-x',
  WebkitMaskRepeat: 'repeat-x',
  // 6px up = the form's bottom padding, so the strip lines up with the disclaimer line.
  maskPosition: 'left 0 bottom 6px',
  WebkitMaskPosition: 'left 0 bottom 6px',
};

/** Questions a fresh chat offers to send in one tap: what shoppers ask most (new stock, delivery cost, an order). */
const STARTERS = ['নতুন কী এসেছে?', 'ডেলিভারি চার্জ কত?', 'আমার অর্ডার কোথায়?'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProductRef[];
  /** A photo the shopper sent (a local preview address; the photo itself never goes to the AI). */
  image?: string;
  /** The cards the shopper ticked when sending this message ("1. Cotton Panjabi"), shown under it. */
  picks?: string[];
  /** A complaint the assistant saved for the store: shown as "received", with a Contact page button when the page is on. */
  complaint?: { contactPage: boolean };
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
  const formatPrice = useFormatPrice(plainPrice);
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
  // Super Admin's voice model (a file in that folder): downloaded ahead and used once complete (lib/voice/voiceModelCache.ts).
  const [voiceModel, setVoiceModel] = useState('model.onnx');
  const [canCall, setCanCall] = useState(false);
  // The store offers the call (the owner's switch in AI Usages, from /chat/status).
  const [voiceOn, setVoiceOn] = useState(false);
  useEffect(() => setCanCall(voiceCallSupported()), []);
  // A shared call link (the dashboard's "Voice call link": the store's address with #call): the page opens with a card
  // inviting the shopper to call. The call itself needs their tap (browsers allow the microphone and sound only after
  // one). The #call is removed from the address at once, so a refresh or a copied address doesn't ask again.
  const [callInvite, setCallInvite] = useState(false);
  useEffect(() => {
    if (window.location.hash !== '#call') return;
    setCallInvite(true);
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }, []);
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
  const handlePhoto = async (file: File | undefined): Promise<ChatProductRef[]> => {
    if (!file || sending) return [];
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
  // Voice typing (the mic beside the photo button): the words fill the message box as the shopper speaks; they check
  // them and press send themselves. Same browser speech recognition and language choice as the search box's mic.
  const dictation = useVoiceSearch({ mode: 'dictation', onInterim: setDraft, onText: setDraft });
  const { error: dictationError, clearError: clearDictationError } = dictation;
  useEffect(() => {
    if (!dictationError) return;
    const t = setTimeout(clearDictationError, 5000);
    return () => clearTimeout(t);
  }, [dictationError, clearDictationError]);
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

  // Phones: the chat opens full screen; the shopper can shrink it to the small corner panel (and back). The choice is
  // kept for this visit (this tab); a new visit starts full screen again. Computers always get the corner panel.
  const [phone, setPhone] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    try {
      setCompact(sessionStorage.getItem(COMPACT_KEY) === '1');
    } catch {
      /* storage blocked: start full screen */
    }
    return () => mq.removeEventListener('change', sync);
  }, []);
  const setCompactChoice = (v: boolean) => {
    setCompact(v);
    try {
      sessionStorage.setItem(COMPACT_KEY, v ? '1' : '0');
    } catch {
      /* storage blocked: the choice just isn't kept */
    }
  };
  const fullScreen = phone && !compact;

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
    // The bubble shows at once from this store's last known answer (kept in this browser); the server's answer below
    // corrects it. Only the very first visit waits, so a store with the chat off never flashes a bubble.
    const cacheKey = `storepal-chat-on:${subdomain}`;
    try {
      const known = localStorage.getItem(cacheKey);
      if (known === '1') setAvailable(true);
    } catch {
      /* storage blocked: wait for the server */
    }
    getChatStatus(subdomain).then((status) => {
      if (cancelled) return;
      try {
        localStorage.setItem(cacheKey, status.available ? '1' : '0');
      } catch {
        /* storage blocked: next page waits again */
      }
      setAvailable(status.available);
      setBridgeAvailable(status.available);
      setPhotoMode(status.photoText);
      setVoiceBase(status.voice);
      setVoiceModel(status.voiceModel);
      setVoiceOn(status.voiceCall);
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
  const handleSend = async (e?: React.FormEvent, asked?: string, voice?: { signal: AbortSignal; live?: ChatLive }): Promise<ChatReply | null> => {
    e?.preventDefault();
    // Sent while the mic was still listening: drop the rest, or it would refill the box after sending.
    if (!voice) dictation.cancel();
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
        // The call speaks the reply's sentences as they arrive (POST chat/stream).
        live: voice?.live,
      });
      setPhotoSlugs([]);
      setMessages((prev) => [...prev, {
          role: 'assistant',
          content: res.reply,
          products: res.products,
          ...(res.complaint?.recorded ? { complaint: { contactPage: res.complaint.contactPage } } : {}),
          at: Date.now(),
        },
      ]);
      // A call's cart changes ("cart theke eita bad dao"): applied to the real cart first, on any line of this store (also
      // what was there before the call), and taken out of the order, so the sync below can't put a removed item back.
      const cartChanges = voice ? (res.actions ?? []).filter((a) => a.type === 'remove_from_cart' || a.type === 'cart_quantity') : [];
      if (cartChanges.length) {
        const fits = (a: { slug: string; options?: Record<string, string> }, slug: string, opts: Record<string, string>) =>
          a.slug === slug && Object.entries(a.options ?? {}).every(([k, v]) => opts[k] === v);
        for (const a of cartChanges) {
          for (const line of myLinesRef.current.filter((l) => fits(a, l.productSlug, l.selectedOptions))) {
            if (a.type === 'remove_from_cart') {
              removeLine(line.id);
              callLinesRef.current.delete(line.id);
            } else if (a.type === 'cart_quantity') {
              setQuantity(line.id, a.quantity);
              if (callLinesRef.current.has(line.id)) callLinesRef.current.set(line.id, a.quantity);
            }
          }
        }
        const base = res.order ?? order;
        if (base) {
          const items = base.items
            .filter((i) => !cartChanges.some((a) => a.type === 'remove_from_cart' && fits(a, i.slug, i.options)))
            .map((i) => {
              const q = cartChanges.find((a) => a.type === 'cart_quantity' && fits(a, i.slug, i.options));
              return q && q.type === 'cart_quantity' ? { ...i, quantity: q.quantity } : i;
            });
          res.order = { ...base, items };
        }
      }
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
  const call = useVoiceCall<ChatProductRef>({
    base: voiceBase,
    model: voiceModel,
    storeName,
    send: async (text, signal, live) => {
      const res = await sendRef.current(undefined, text, { signal, live });
      if (!res) throw new Error('no reply');
      return { reply: res.reply, products: res.products, actions: res.actions };
    },
    onGreeting: (greeting) => setMessages((prev) => [...prev, { role: 'assistant', content: greeting, at: Date.now() }]),
    // "ছবি দিয়ে খুঁজতে চাই": the call opens no camera of its own; the store search's photo button is brought into view and
    // made to stand out, and its results come back below (the photo search effect).
    photoHint: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      usePhotoSearch.getState().hint();
    },
    // A product the assistant talks about: its page opens in this tab; the call goes on (this widget lives in the store layout).
    onOpenProduct: (slug) => router.push(`/store/${subdomain}/product/${slug}`),
    // "X khuje dekhao": the store's own search results page; several products the assistant shows: the same page listing
    // just those (?picks=); "back jao": the browser's Back.
    navigate: {
      search: (query) => router.push(`/store/${subdomain}?q=${encodeURIComponent(query)}`),
      picks: (slugs) => router.push(`/store/${subdomain}?picks=${encodeURIComponent(slugs.slice(0, 12).join(','))}`),
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
  // The store's photo search (the search box's camera button) finishing during a call: its results are on the page
  // already; the call says what it found, and the next spoken turn tells the AI which products the photo matched.
  const callPhaseRef = useRef(call.phase);
  callPhaseRef.current = call.phase;
  const photoFoundRef = useRef(call.photoFound);
  photoFoundRef.current = call.photoFound;
  useEffect(
    () =>
      usePhotoSearch.subscribe((s, prev) => {
        if (s.status !== 'done' || prev.status === 'done' || callPhaseRef.current !== 'connected') return;
        const found: ChatProductRef[] = s.products.slice(0, 8).map((p) => ({
          slug: p.slug,
          name: p.name,
          photoUrl: p.photoUrls[0] ?? null,
          price: p.discountPrice ?? p.price,
        }));
        setPhotoSlugs(found.map((p) => p.slug));
        photoFoundRef.current(found);
      }),
    [],
  );
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
    trackFeature('VOICE_CALL');
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
  // The call is offered: this browser can do it, the store has it on, and the chat can answer.
  const callable = canCall && voiceOn && available === true;
  // The shopper opened the assistant (or a call link): the voice files start downloading quietly in the background
  // (lib/voice/voicePrefetch.ts), so a call later doesn't wait for them.
  useEffect(() => {
    if ((open || callInvite) && callable) prefetchVoice(voiceBase, voiceModel);
  }, [open, callInvite, callable, voiceBase, voiceModel]);

  // A call link opened where the store doesn't offer the call (switched off): the chat opens instead, quietly.
  useEffect(() => {
    if (!callInvite || available === null) return;
    if (available !== true) setCallInvite(false);
    else if (canCall && !voiceOn) {
      setCallInvite(false);
      setOpen(true);
    }
  }, [callInvite, available, canCall, voiceOn]);
  const [linkCopied, setLinkCopied] = useState(false);
  const callInviteCard = callInvite && available === true && call.phase === 'idle' && (callable || !canCall) && (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="call-invite-title">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white" aria-hidden>
          <Phone size={28} />
        </span>
        <h2 id="call-invite-title" className="text-[17px] font-semibold text-ink">
          {storeName}
        </h2>
        {callable ? (
          <>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              আমাদের সহকারীর সাথে কথা বলুন। পণ্য, দাম, ডেলিভারি যা খুশি জিজ্ঞেস করুন, চাইলে অর্ডারও করতে পারবেন।
            </p>
            <button
              type="button"
              onClick={() => {
                setCallInvite(false);
                startCall();
              }}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-[15px] font-semibold text-white hover:bg-green-700"
            >
              <Phone size={18} />
              কল করুন
            </button>
            <p className="mt-2 text-[11.5px] text-muted">মাইক্রোফোন চালু করার অনুমতি চাইবে।</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              এই ব্রাউজারে কল করা যায় না। লিংকটা কপি করে Chrome-এ খুলুন, অথবা চ্যাটে লিখে জিজ্ঞেস করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(`${window.location.origin}${window.location.pathname}#call`)
                  .then(() => setLinkCopied(true))
                  .catch(() => undefined);
              }}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-ink text-[14px] font-semibold text-white hover:opacity-90"
            >
              {linkCopied ? 'লিংক কপি হয়েছে' : 'লিংক কপি করুন'}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setCallInvite(false);
            setOpen(true);
          }}
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl text-[13.5px] font-medium text-ink hover:bg-canvas"
        >
          চ্যাটে লিখুন
        </button>
      </div>
    </div>
  );

  // Ran out mid-chat: keep the open panel (with its polite note) until the
  // shopper closes it, then hide the bubble too.
  // A call in progress stays on screen even if the wallet ran out during it, or on a page without the store header.
  if (call.phase === 'idle' && !headerHere) return null;
  if (available !== true && !open) return call.phase === 'idle' ? null : voiceCallScreen;
  if (!headerHere) return voiceCallScreen;

  return (
    <>
      {voiceCallScreen}
      {callInviteCard}
      {/* The round bubble only opens the chat; while it is open, the close button is in the panel's header. */}
      {!open && call.phase === 'idle' && (
      <button
        onClick={() => {
          setOpen(true);
          trackFeature('AI_CHAT_OPEN', { oncePerSession: true });
        }}
        aria-label="Chat with our assistant"
        title="শপিং সহকারীর সাথে কথা বলুন"
        className="fixed bottom-[76px] right-5 z-30 w-14 h-14 rounded-full bg-accent hover:bg-accent-dark text-white shadow-[0_4px_10px_-2px_rgba(16,24,40,0.25),0_14px_32px_-8px_rgba(16,24,40,0.40)] flex items-center justify-center transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onFocus={reveal}
        style={{
          transform: cartOpen
            ? 'translateX(calc(-100vw + 5.5rem))'
            : scrolledAway
              ? floatingHideTransform('right')
              : undefined,
        }}
      >
        <MessageCircle size={26} strokeWidth={2.2} />
      </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Shopping assistant"
          className={
            fullScreen
              ? 'fixed inset-0 z-50 w-full h-[100dvh] bg-surface flex flex-col overflow-hidden overscroll-contain'
              : 'fixed bottom-[76px] right-5 z-30 w-[min(380px,calc(100vw-2.5rem))] h-[min(600px,calc(100vh-120px))] bg-surface rounded-2xl border border-line shadow-[0_2px_6px_rgba(16,24,40,0.06),0_12px_24px_-6px_rgba(16,24,40,0.12),0_32px_72px_-12px_rgba(16,24,40,0.30)] flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none'
          }
          style={{ transform: cartOpen && !fullScreen ? 'translateX(calc(-100vw + 2.5rem + min(380px, 100vw - 2.5rem)))' : undefined }}
        >
          {/* The store's own helper: its initial and name, in the store's colour. The accent is kept for the shopper's words. */}
          <div className="relative z-10 isolate flex items-center gap-1 pl-3.5 pr-2 py-2.5 border-b border-line bg-surface shrink-0 shadow-[0_2px_8px_-2px_rgba(16,24,40,0.08)]">
            {/* The little shopping street behind the header (under the name and buttons: -z-10 inside this isolated layer). */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-accent opacity-[0.14]" style={HEADER_STREET_STYLE} />
            <span className="w-9 h-9 shrink-0 rounded-full bg-accent-light text-accent font-bold text-[15px] flex items-center justify-center ring-2 ring-surface shadow-[0_2px_6px_-1px_rgba(16,24,40,0.18)]" aria-hidden>
              {(storeName.trim()[0] ?? 'S').toUpperCase()}
            </span>
            <span className="ml-2 flex-1 min-w-0">
              <span className="block truncate text-[14px] font-semibold leading-tight text-ink">{storeName}</span>
              <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-muted">এআই শপিং সহকারী</span>
            </span>
            {callable && (
              <button type="button" onClick={startCall} aria-label="Voice call the assistant" title="কল করে কথা বলুন" className={HEADER_BUTTON}>
                <Phone size={17} />
              </button>
            )}
            <button
              type="button"
              onClick={toggleHistory}
              aria-pressed={showHistory}
              aria-label="Past chats"
              title="আগের চ্যাট"
              className={`${HEADER_BUTTON} ${showHistory ? 'bg-canvas text-ink' : ''}`}
            >
              <History size={17} />
            </button>
            <button type="button" onClick={startNewChat} aria-label="New chat" title="নতুন চ্যাট" className={HEADER_BUTTON}>
              <SquarePen size={17} />
            </button>
            {phone && (
              <button
                type="button"
                onClick={() => setCompactChoice(!compact)}
                aria-label={compact ? 'Full screen' : 'Make smaller'}
                title={compact ? 'পুরো স্ক্রিনে দেখুন' : 'ছোট করুন'}
                className={HEADER_BUTTON}
              >
                {compact ? <Maximize2 size={17} /> : <Minimize2 size={17} />}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" title="বন্ধ করুন" className={HEADER_BUTTON}>
              <X size={19} />
            </button>
          </div>
          {showHistory && (
            <div className="flex-1 overflow-y-auto bg-surface p-2">
              <p className="px-2.5 pt-2 pb-1.5 text-[12.5px] font-semibold text-ink">আগের চ্যাট</p>
              {chats.length === 0 ? (
                <p className="px-2 py-10 text-center text-[13px] text-muted">এখনো কোনো চ্যাট রাখা নেই। নতুন চ্যাট শুরু করলে এখানে থাকবে।</p>
              ) : (
                chats.map((c) => (
                  <div key={c.id} className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-canvas ${c.id === chatId ? 'bg-canvas' : ''}`}>
                    <button
                      type="button"
                      onClick={() => {
                        loadChat(c);
                        setCurrentChatId(subdomain, c.id);
                        setShowHistory(false);
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="block text-[13px] font-medium text-ink truncate">{c.title}</span>
                      <span className="block text-[11.5px] text-muted">
                        {ago(c.updatedAt)}, {c.messages.length}টি মেসেজ
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
                      className="w-8 h-8 shrink-0 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* The doodle layer stays put behind the messages (they scroll over it, like WhatsApp). */}
          <div className={`relative flex-1 min-h-0 bg-canvas ${showHistory ? 'hidden' : 'block'}`}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-accent opacity-[0.12]" style={DOODLE_STYLE} />
          <div ref={scrollRef} className="relative h-full overflow-y-auto px-3.5 py-4 flex flex-col gap-3.5">
            {messages.map((m, i) => (
              <div key={i} data-chat-msg className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- the shopper's own photo, a local preview
                  <img src={m.image} alt="Your photo" className="max-w-[62%] max-h-44 rounded-2xl rounded-tr-md border border-line object-cover" />
                ) : (
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-accent text-white rounded-2xl rounded-tr-md shadow-[0_2px_4px_rgba(16,24,40,0.08),0_6px_16px_-6px_rgba(16,24,40,0.28)]'
                        : `bg-surface text-ink border border-line rounded-2xl rounded-tl-md ${SOFT_SHADOW}`
                    }`}
                  >
                    {m.content}
                    {m.picks && <span className="block mt-1 text-[11.5px] opacity-85">✓ {m.picks.join(', ')}</span>}
                  </div>
                )}
                {m.at && <span className="mt-1 px-1 text-[10.5px] text-muted">{chatTime(m.at)}</span>}

                {m.complaint && (
                  <div className={`mt-2 w-full max-w-[85%] rounded-2xl border border-line bg-surface px-3.5 py-3 text-[12.5px] text-ink ${SOFT_SHADOW}`}>
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-green-600" aria-hidden />
                      আপনার অভিযোগ দোকানে পৌঁছে গেছে
                    </span>
                    {m.complaint.contactPage && (
                      <>
                        <span className="block mt-1 text-muted">খুব জরুরি হলে সরাসরি যোগাযোগ করুন:</span>
                        <Link
                          href={`/store/${subdomain}/contact`}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                        >
                          <Phone className="w-3.5 h-3.5" aria-hidden />
                          যোগাযোগ পাতা
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {m.products && m.products.length > 0 && (
                  // One grouped list (rows, not a card per product): the numbers are what the shopper says ("২ নম্বরটা").
                  <ul className={`mt-2 w-full max-w-[92%] rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden ${SOFT_SHADOW}`}>
                    {m.products.map((p, n) => {
                      const on = selection?.msg === i && selection.slugs.includes(p.slug);
                      return (
                        <li key={p.slug} className={`flex items-center gap-2.5 pl-2.5 pr-2 py-2 transition-colors ${on ? 'bg-accent-light' : 'hover:bg-canvas'}`}>
                          <span className="w-4 shrink-0 text-center text-[12px] font-semibold tabular-nums text-muted" aria-hidden>
                            {n + 1}
                          </span>
                          <Link href={`/store/${subdomain}/product/${p.slug}`} onClick={onProductOpen} className="flex flex-1 min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
                            <span className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-canvas border border-line">
                              {p.photoUrl && <Image src={p.photoUrl} alt={p.name} fill sizes="48px" className="object-cover" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[12.5px] leading-snug text-ink line-clamp-2">{p.name}</span>
                              <span className="block mt-0.5 text-[13px] font-bold text-ink">{formatPrice(p.price)}</span>
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
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            {messages.length === 1 && !sending && available !== false && (
              // Starters for a fresh chat: each one is a real question sent as it is.
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void handleSend(undefined, q)}
                    className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[12.5px] text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-accent hover:text-accent hover:shadow-[0_3px_10px_-3px_rgba(16,24,40,0.15)] transition-[color,border-color,box-shadow]"
                  >
                    {q}
                  </button>
                ))}
                {callable && (
                  <button
                    type="button"
                    onClick={startCall}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-surface px-3.5 py-1.5 text-[12.5px] font-medium text-accent hover:bg-accent hover:text-white transition-colors"
                  >
                    <Phone size={13} />
                    লিখতে না চাইলে কল করুন
                  </button>
                )}
              </div>
            )}
            {order && <ChatOrderCard order={order} details={details} onDetails={setDetails} onCheckout={checkout} busy={checkingOut} />}
            {sending && (
              <div className={`self-start flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-surface px-3.5 py-3 ${SOFT_SHADOW}`} role="status" aria-label="উত্তর লেখা হচ্ছে">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>
          </div>

          {selection && !showHistory && (
            <div className="flex items-center gap-2 border-t border-line bg-accent-light px-3.5 py-2 text-[12.5px] text-ink shrink-0">
              <Check size={15} className="text-accent shrink-0" strokeWidth={3} />
              <span className="flex-1 min-w-0 truncate">
                বাছাই করা:{' '}
                {(messages[selection.msg]?.products ?? [])
                  .map((p, n) => (selection.slugs.includes(p.slug) ? `${n + 1}. ${p.name}` : null))
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <button type="button" onClick={() => setSelection(null)} className="w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-white/60 flex items-center justify-center" aria-label="Clear selection">
                <X size={15} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="relative isolate border-t border-line bg-surface px-3 pt-2.5 pb-1.5 shrink-0 shadow-[0_-2px_8px_-2px_rgba(16,24,40,0.06)]">
            {/* The delivery drawing behind the message box: same line style as the header's street, on the other side. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-accent opacity-[0.16]" style={FOOTER_DELIVERY_STYLE} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <div className={`flex items-center gap-1 rounded-full border border-line-strong bg-surface pl-1 pr-1 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-light ${SOFT_SHADOW}`}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending || available === false}
                aria-label="Send a photo"
                title="পণ্যের ছবি পাঠান"
                className="w-9 h-9 shrink-0 rounded-full text-muted hover:text-ink hover:bg-canvas flex items-center justify-center disabled:opacity-40 transition-colors"
              >
                <ImagePlus size={18} />
              </button>
              {dictation.supported && (
                <button
                  type="button"
                  onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
                  disabled={sending || available === false}
                  aria-pressed={dictation.listening}
                  aria-label={dictation.listening ? 'Stop voice typing' : 'Type by voice'}
                  title={dictation.listening ? 'থামান' : 'বলে লিখুন'}
                  className={`relative w-9 h-9 shrink-0 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors ${
                    dictation.listening ? 'bg-accent text-white' : 'text-muted hover:text-ink hover:bg-canvas'
                  }`}
                >
                  {dictation.listening && (
                    <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30 motion-reduce:animate-none" aria-hidden />
                  )}
                  <Mic size={18} className="relative" />
                </button>
              )}
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
                aria-label="Message"
                disabled={sending || available === false}
                className="flex-1 min-w-0 bg-transparent py-2.5 text-[13.5px] text-ink placeholder:text-muted outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || available === false || (!draft.trim() && !selection)}
                aria-label="Send"
                className="w-9 h-9 shrink-0 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_3px_8px_-2px_rgba(16,24,40,0.30)] disabled:bg-line-strong disabled:text-white disabled:shadow-none hover:bg-accent-dark transition-colors"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </div>
            {/* The text sits on a small white patch, so the drawing strip behind it runs on both sides without crossing the words. */}
            <p className="mt-1.5 text-center leading-[18px]">
              {/* While voice typing (or after it failed), this line says so instead of the usual note. */}
              <span className={`bg-surface px-1.5 text-[10.5px] ${dictationError ? 'text-red-600' : dictation.listening ? 'text-accent font-medium' : 'text-muted'}`} role={dictationError ? 'alert' : undefined}>
                {dictationError === 'denied'
                  ? 'মাইক্রোফোনের অনুমতি দিন, তারপর আবার চাপুন।'
                  : dictationError === 'no-speech'
                    ? 'কিছু শোনা যায়নি। আবার চাপুন ও বলুন।'
                    : dictationError
                      ? 'ভয়েস কাজ করছে না, লিখে পাঠান।'
                      : dictation.listening
                        ? `শুনছি… (${dictation.lang === 'en-US' ? 'English' : 'বাংলা'}) বলা শেষ হলে আবার চাপুন`
                        : 'এআই উত্তর দেয়। দাম ও স্টক পণ্যের পাতায় মিলিয়ে নিন।'}
              </span>
            </p>
          </form>
        </div>
      )}
    </>
  );
}
