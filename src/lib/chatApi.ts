// Client-side (browser) fetch helper for the Store AI Chat Bot widget —
// same host-detection pattern as checkoutApi.ts (see its own header
// comment for why this can't use the server-only API_URL).
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

import type { ChatOrder } from './chatOrder';

/** The order draft the widget keeps for the whole chat and sends with every message. */
export interface ChatOrderDraftInput {
  items: Array<{ slug: string; quantity: number; options: Record<string, string> }>;
  name?: string;
  phone?: string;
  address?: string;
  district?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProductRef {
  slug: string;
  name: string;
  photoUrl: string | null;
  /** Discounted price when set, otherwise regular price — same "what a shopper actually pays" priority as everywhere else. */
  price: string;
}

export interface ChatReply {
  reply: string;
  /** The order being taken in the chat (lib/chatOrder.ts), or null when the shopper is only asking. */
  order?: ChatOrder | null;
  /** Products the assistant actually mentioned/recommended, in relevance order — see StorefrontController.chat. */
  products: ChatProductRef[];
  /** Voice call only: what to do on the shopper's screen (server chat-order.ts cleanActions). */
  actions?: ChatAction[];
  /** The assistant saved a complaint for the store (record_complaint); contactPage = the store's Contact page is on. */
  complaint?: { recorded: boolean; contactPage: boolean };
}

/** A screen action the assistant asks for on a call ("client-side tools"); the browser does it (lib/voice/useVoiceCall.ts). */
export type ChatAction =
  | { type: 'search'; query: string }
  | { type: 'open_product'; slug: string }
  | { type: 'go_back' | 'show_cart' | 'close_cart' | 'photo_search' | 'hang_up' };

/** Thrown when the store's AI Credit wallet is empty (HTTP 402, code AI_CREDITS_EMPTY; AI_TOKENS_EMPTY from an API older than credits). */
export class ChatUnavailableError extends Error {}

/** Where a chat photo's text is read (Super Admin > AI Settings): BROWSER = this page reads it, SERVER = POST chat/photo returns it. */
export type PhotoTextMode = 'BROWSER' | 'SERVER';

/** Where the shopper is when they ask (server StoreChatDto.context). */
export interface ChatPageContext {
  productSlug?: string;
  cart?: { slug: string; quantity: number; options?: Record<string, string> }[];
}

export interface ChatStatus {
  available: boolean;
  photoText: PhotoTextMode;
  /** The voice call's files on R2 (Piper speaker 8, lib/voice); null = no Piper, the call uses the Google voice only. */
  voice: string | null;
}

/**
 * Whether the store can pay for a chat reply right now (ai-token-plan.md
 * Step 5), and where a photo's text is read. Any failure reads as "not
 * available", so a broken status call never shows a widget that can't answer.
 */
export async function getChatStatus(subdomain: string): Promise<ChatStatus> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat/status`, { cache: 'no-store' });
    if (!res.ok) return { available: false, photoText: 'BROWSER', voice: null };
    const body = (await res.json()) as { available?: boolean; photoText?: string; voice?: string | null };
    return {
      available: body.available === true,
      photoText: body.photoText === 'SERVER' ? 'SERVER' : 'BROWSER',
      voice: typeof body.voice === 'string' && /^https?:\/\/.+\/$/.test(body.voice) ? body.voice : null,
    };
  } catch {
    return { available: false, photoText: 'BROWSER', voice: null };
  }
}

export async function sendChatMessage(
  subdomain: string,
  message: string,
  history: ChatTurn[],
  order?: ChatOrderDraftInput | null,
  photoSlugs?: string[],
  photoText?: string | null,
  cards?: {
    shownSlugs: string[];
    selectedSlugs: string[];
    voice?: boolean;
    signal?: AbortSignal;
    context?: ChatPageContext;
    /** The voice call: the reply's finished pieces as they are written (POST chat/stream), and each lookup the AI makes. */
    live?: ChatLive;
  },
): Promise<ChatReply> {
  const streamed = !!cards?.voice && !!cards.live;
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat${streamed ? '/stream' : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: cards?.signal,
    body: JSON.stringify({ message, history, ...(order ? { order } : {}), ...(photoSlugs?.length ? { photoSlugs } : {}), ...(photoText ? { photoText } : {}),
      // The latest product cards (numbered on screen) and the ones the shopper ticked.
      ...(cards?.shownSlugs.length ? { shownSlugs: cards.shownSlugs } : {}),
      ...(cards?.selectedSlugs.length ? { selectedSlugs: cards.selectedSlugs } : {}),
      // The voice call (lib/voice): the server asks for a short reply in Bangla letters, since it is read aloud.
      ...(cards?.voice ? { voice: true } : {}),
      // The product page open now and the cart, so "eita" and "cart e ki ache" work.
      ...(cards?.context ? { context: cards.context } : {}),
    }),
  });

  if (!res.ok) throw chatError(res.status, await res.json().catch(() => null));
  if (streamed && res.body) return readChatStream(res.body, cards!.live!);
  return res.json();
}

/** Listeners for a streamed (voice call) chat turn. */
export interface ChatLive {
  /** A finished piece of the spoken reply (a sentence, or the first clause of a long first sentence), in order. */
  onSay: (text: string) => void;
  /** The AI is looking something up (delivery_info, order_status, product_details, search_products, record_complaint). */
  onTool?: (name: string) => void;
}

type StreamEvent =
  | { t: 'say'; text: string }
  | { t: 'tool'; name: string }
  | { t: 'done'; data: ChatReply }
  | { t: 'error'; status: number; body: { code?: string; message?: string | string[] } | null };

function chatError(status: number, body: { code?: string; message?: string | string[] } | null): Error {
  if (status === 402 && (body?.code === 'AI_CREDITS_EMPTY' || body?.code === 'AI_TOKENS_EMPTY')) {
    return new ChatUnavailableError('অ্যাসিস্ট্যান্ট এখন উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করুন।');
  }
  const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
  return new Error(msg || 'অ্যাসিস্ট্যান্ট এই মুহূর্তে উত্তর দিতে পারছে না। আবার চেষ্টা করুন।');
}

/** Reads POST chat/stream: one JSON object per line (server StorefrontController.chatStream). */
async function readChatStream(body: ReadableStream<Uint8Array>, live: ChatLive): Promise<ChatReply> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const handle = (line: string): ChatReply | null => {
    if (!line.trim()) return null;
    let event: StreamEvent;
    try {
      event = JSON.parse(line) as StreamEvent;
    } catch {
      return null;
    }
    if (event.t === 'say') live.onSay(event.text);
    else if (event.t === 'tool') live.onTool?.(event.name);
    else if (event.t === 'done') return event.data;
    else if (event.t === 'error') throw chatError(event.status, event.body);
    return null;
  };
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const result = handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
      if (result) {
        void reader.cancel().catch(() => undefined);
        return result;
      }
    }
    if (done) {
      const result = handle(buffer);
      if (result) return result;
      throw new Error('অ্যাসিস্ট্যান্টের উত্তর মাঝপথে থেমে গেছে। আবার বলবেন?');
    }
  }
}

/**
 * A photo the shopper sends in the chat: shrunk here and matched by the server with the store's own product photos by
 * picture fingerprint. The photo is never shown to the AI. In SERVER mode it is sent bigger (1600 px) and the answer
 * also carries the text the server read in it (photo-match/photo-text.ts); in BROWSER mode that text is read by
 * lib/photoText.ts instead and `text` is null.
 */
export async function sendChatPhoto(subdomain: string, file: File, mode: PhotoTextMode): Promise<{ products: ChatProductRef[]; text: string | null }> {
  const side = mode === 'SERVER' ? 1600 : 512;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const photo = canvas.toDataURL('image/jpeg', mode === 'SERVER' ? 0.85 : 0.75);
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || 'ছবিটি পড়া যায়নি। অন্য একটি ছবি দিন।');
  }
  const body = (await res.json()) as { products: ChatProductRef[]; text?: string | null };
  return { products: body.products, text: body.text ?? null };
}
