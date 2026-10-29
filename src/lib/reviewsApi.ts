// Client-side (browser) fetch helper for the storefront's product
// reviews (product page "Reviews" tab - see ProductTabs.tsx, which is a
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
  /** A buyer's video (Advance-plan stores only); null/absent = none. */
  videoUrl?: string | null;
  customerName: string | null;
  featured: boolean;
  createdAt: string;
  /** The store's public reply (plain text); null/absent = none. Shown by StorePal only. */
  replyText?: string | null;
  repliedAt?: string | null;
  /** "Helpful" votes (TellMe idea 99). */
  helpfulCount?: number;
  /** The server confirmed a Completed order of this product (TellMe idea 99). */
  verified?: boolean;
}

export interface SubmitReviewInput {
  title: string;
  content?: string;
  rating: number;
  customerName: string;
  customerEmail?: string;
  // "Upload Photos" - already-uploaded picture URLs (see
  // SubmitReviewDto's own comment on the backend). Only the StorePal
  // theme's review form currently offers a photo upload control.
  photos?: string[];
  /** The order's tracking token from the "Review your products" link; the server checks it (TellMe idea 99). */
  orderToken?: string;
}

/** Approved reviews for one product - see ReviewsService.listForProduct on the backend. */
export async function getProductReviews(subdomain: string, slug: string, sort: 'newest' | 'helpful' = 'newest'): Promise<ProductReview[]> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews${sort === 'helpful' ? '?sort=helpful' : ''}`);
  if (!res.ok) {
    throw new Error('Could not load reviews.');
  }
  return res.json();
}

/**
 * Submits a new review from the product page. Signed-in shoppers of this store only (the server refuses a guest since
 * 2026-10-28), one review per account and product. Always lands pending approval; the caller shows a "thanks,
 * pending approval" message rather than the review itself appearing immediately.
 */
export async function submitProductReview(subdomain: string, slug: string, input: SubmitReviewInput, accessToken: string): Promise<void> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not submit your review. Please try again.');
  }
}

export interface ReviewMediaEligibility {
  canAddPhotos: boolean;
  maxPhotos: number;
  /** One video too (stores on the Advance plan only). */
  canAddVideo?: boolean;
  maxVideoMb?: number;
}

/** Whether the signed-in shopper may add photos (and a video) to a review of this product (their own account bought it here). False on any error. */
export async function getReviewPhotoEligibility(subdomain: string, slug: string, accessToken: string): Promise<ReviewMediaEligibility> {
  try {
    const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews/photo-eligibility`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { canAddPhotos: false, maxPhotos: 0 };
    return res.json();
  } catch {
    return { canAddPhotos: false, maxPhotos: 0 };
  }
}

/** The review form with photos (already shrunk in the browser, lib/reviewPhotos.ts) and/or one video (lib/reviewVideo.ts). Signed-in shoppers only; same pending approval. */
export async function submitProductReviewWithPhotos(
  subdomain: string,
  slug: string,
  input: SubmitReviewInput,
  photos: Blob[],
  accessToken: string,
  video?: File | null,
): Promise<void> {
  const form = new FormData();
  form.append('title', input.title);
  form.append('rating', String(input.rating));
  form.append('customerName', input.customerName);
  if (input.content) form.append('content', input.content);
  if (input.customerEmail) form.append('customerEmail', input.customerEmail);
  if (input.orderToken) form.append('orderToken', input.orderToken);
  photos.forEach((p, i) => form.append('photos', p, `photo-${i + 1}.jpg`));
  if (video) form.append('video', video, video.name || 'video.mp4');
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/products/${slug}/reviews/with-photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not submit your review. Please try again.');
  }
}

/** One "helpful" vote on a review (TellMe idea 99); the server allows one per address. Returns the new count. */
export async function voteReviewHelpful(subdomain: string, reviewId: string): Promise<{ helpfulCount: number; counted: boolean }> {
  const res = await fetch(`${apiOrigin()}/v1/store/${subdomain}/reviews/${encodeURIComponent(reviewId)}/helpful`, { method: 'POST' });
  if (!res.ok) throw new Error('Could not save your vote.');
  return res.json();
}
