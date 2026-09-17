// Client-side (browser) fetch helper for the storefront's product
// reviews (product page "Reviews" tab — see ProductTabs.tsx, which is a
// Client Component). Same host-detection pattern as checkoutApi.ts; see
// that file's header comment for why this can't use the server-only
// API_URL from storefrontApi.ts.
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface ProductReview {
  id: string;
  title: string;
  content: string | null;
  rating: number;
  photos: string[];
  customerName: string | null;
  featured: boolean;
  createdAt: string;
}

export interface SubmitReviewInput {
  title: string;
  content?: string;
  rating: number;
  customerName: string;
  customerEmail?: string;
  // "Upload Photos" — already-uploaded Cloudinary URLs (see
  // SubmitReviewDto's own comment on the backend). Only the StorePal
  // theme's review form currently offers a photo upload control.
  photos?: string[];
}

/** Approved reviews for one product — see ReviewsService.listForProduct on the backend. */
export async function getProductReviews(subdomain: string, slug: string): Promise<ProductReview[]> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews`);
  if (!res.ok) {
    throw new Error('Could not load reviews.');
  }
  return res.json();
}

/**
 * Submits a new review from the product page. No auth — a shopper need
 * not have a Customer account (see SubmitReviewDto's own comment on the
 * backend). Always lands pending approval; the caller shows a "thanks,
 * pending approval" message rather than the review itself appearing
 * immediately.
 */
export async function submitProductReview(subdomain: string, slug: string, input: SubmitReviewInput): Promise<void> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not submit your review. Please try again.');
  }
}
