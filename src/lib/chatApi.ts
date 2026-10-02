// Client-side (browser) fetch helper for the Store AI Chat Bot widget —
// same host-detection pattern as checkoutApi.ts (see its own header
// comment for why this can't use the server-only API_URL).
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
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
  /** Products the assistant actually mentioned/recommended, in relevance order — see StorefrontController.chat. */
  products: ChatProductRef[];
}

/** Thrown when the store's AI token wallet is empty (HTTP 402, code AI_TOKENS_EMPTY). */
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

export async function sendChatMessage(subdomain: string, message: string, history: ChatTurn[]): Promise<ChatReply> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 402 && body?.code === 'AI_TOKENS_EMPTY') {
      throw new ChatUnavailableError("The assistant isn't available right now. Please try again later.");
    }
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || 'The assistant is temporarily unavailable. Please try again.');
  }

  return res.json();
}
