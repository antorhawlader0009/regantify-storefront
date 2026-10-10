// Client-side (browser) fetch helper for StorePal's product Q&A (the "Questions" tab on a product page). Same
// host-detection pattern as reviewsApi.ts / checkoutApi.ts (see checkoutApi.ts for why the server-only API_URL can't be
// used in the browser).
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

/** An answered question; a question with no answer is never public (server ProductQuestionsService.listForProduct). */
export interface ProductQuestion {
  id: string;
  customerName: string;
  question: string;
  answer: string;
  answeredAt: string;
}

export async function getProductQuestions(subdomain: string, slug: string): Promise<ProductQuestion[]> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/questions`);
  if (!res.ok) throw new Error('Could not load questions.');
  const data = (await res.json()) as { questions: ProductQuestion[] };
  return data.questions;
}

/** Sends a question. No account needed; it stays unseen until the store answers it. */
export async function askProductQuestion(subdomain: string, slug: string, input: { customerName: string; question: string }): Promise<void> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not send your question. Please try again.');
  }
}
