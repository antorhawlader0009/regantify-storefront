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
}

/** Thrown when the store's AI Credit wallet is empty (HTTP 402, code AI_CREDITS_EMPTY; AI_TOKENS_EMPTY from an API older than credits). */
export class ChatUnavailableError extends Error {}

/**
 * Whether the store can pay for a chat reply right now (ai-token-plan.md
 * Step 5). Any failure reads as "not available", so a broken status call
 * never shows a widget that can't answer.
 */
export async function getChatAvailable(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat/status`, { cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { available?: boolean };
    return body.available === true;
  } catch {
    return false;
  }
}

export async function sendChatMessage(subdomain: string, message: string, history: ChatTurn[], order?: ChatOrderDraftInput | null, photoSlugs?: string[]): Promise<ChatReply> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, ...(order ? { order } : {}), ...(photoSlugs?.length ? { photoSlugs } : {}) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 402 && (body?.code === 'AI_CREDITS_EMPTY' || body?.code === 'AI_TOKENS_EMPTY')) {
      throw new ChatUnavailableError("The assistant isn't available right now. Please try again later.");
    }
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || 'The assistant is temporarily unavailable. Please try again.');
  }

  return res.json();
}

/**
 * A photo the shopper sends in the chat: shrunk here (512 px JPEG) and matched by the server with the store's own product
 * photos by picture fingerprint. It is never shown to the AI, so it costs no AI Credits.
 */
export async function sendChatPhoto(subdomain: string, file: File): Promise<ChatProductRef[]> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const photo = canvas.toDataURL('image/jpeg', 0.75);
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || 'Could not read this photo. Please try another one.');
  }
  const body = (await res.json()) as { products: ChatProductRef[] };
  return body.products;
}
