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

export async function sendChatMessage(subdomain: string, message: string, history: ChatTurn[]): Promise<ChatReply> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || 'The assistant is temporarily unavailable. Please try again.');
  }

  return res.json();
}
