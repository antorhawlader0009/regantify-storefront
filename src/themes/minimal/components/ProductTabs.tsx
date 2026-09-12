'use client';

import { useEffect, useState } from 'react';
import { Stars } from './Stars';
import { getProductReviews, submitProductReview, type ProductReview } from '@/lib/reviewsApi';

/** Rendered inside the parent page's own section — no outer border here,
 * this is just the tab content, matching Medium's ProductTabs contract. */
export function ProductTabs({ subdomain, slug, description }: { subdomain: string; slug: string; description?: string | null }) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    getProductReviews(subdomain, slug)
      .then(setReviews)
      .catch((err) => setReviewsError(err instanceof Error ? err.message : 'Could not load reviews.'));
  }, [subdomain, slug]);

  return (
    <div>
      <div className="flex gap-8 border-b border-line mb-6">
        {(['description', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3.5 px-0 bg-transparent border-0 text-[12px] tracking-[0.06em] uppercase transition-colors ${
              activeTab === tab ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {tab === 'reviews' ? `Reviews${reviews ? ` (${reviews.length})` : ''}` : 'Description'}
            {activeTab === tab && <span className="absolute left-0 right-0 -bottom-px h-px bg-ink" />}
          </button>
        ))}
      </div>

      {activeTab === 'description' ? (
        description ? (
          <div className="text-[13.5px] text-ink/80 leading-relaxed max-w-2xl" dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <p className="text-[13px] text-muted">No description provided for this product.</p>
        )
      ) : (
        <div className="max-w-2xl">
          {reviewsError && <p className="text-[13px] text-accent-dark mb-4">{reviewsError}</p>}

          {!reviewsError && reviews === null && <p className="text-[13px] text-muted mb-4">Loading reviews…</p>}

          {reviews && reviews.length === 0 && (
            <p className="text-[13px] text-muted mb-4">No reviews yet — be the first to write one.</p>
          )}

          {reviews && reviews.length > 0 && (
            <div className="flex flex-col gap-5 mb-8">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-line pb-5 last:border-0">
                  <div className="flex items-center gap-2">
                    <Stars count={r.rating} />
                    {r.featured && (
                      <span className="text-[10px] tracking-[0.06em] uppercase text-muted">Featured</span>
                    )}
                  </div>
                  <p className="mt-2 text-[13.5px] text-ink">{r.title}</p>
                  {r.content && <p className="mt-1 text-[13px] text-ink/80 leading-relaxed">{r.content}</p>}
                  {r.photos.length > 0 && (
                    <div className="flex gap-2 mt-2.5">
                      {r.photos.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element -- small user-submitted review photos, not worth next/image's overhead here
                        <img key={i} src={url} alt="" className="w-14 h-14 object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[11.5px] text-muted">{r.customerName ?? 'Anonymous'}</p>
                </div>
              ))}
            </div>
          )}

          <WriteReviewForm subdomain={subdomain} slug={slug} />
        </div>
      )}
    </div>
  );
}

function WriteReviewForm({ subdomain, slug }: { subdomain: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !name.trim()) {
      setError('Please enter your name and a review title.');
      return;
    }
    setSubmitting(true);
    try {
      await submitProductReview(subdomain, slug, {
        title: title.trim(),
        content: content.trim() || undefined,
        rating,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
      });
      setSubmitted(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="border-t border-line pt-5 text-[13px] text-ink">
        Thanks for your review — it&apos;ll show up here once the store approves it.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] tracking-[0.04em] uppercase text-ink border-b border-ink pb-0.5 hover:opacity-70 transition-opacity"
      >
        Write a review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line pt-5 space-y-3.5">
      <div>
        <p className="text-[11px] tracking-[0.06em] uppercase text-muted mb-2">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-[18px] ${n <= rating ? 'text-ink' : 'text-line-strong'}`}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title"
        className="w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-line outline-none transition-colors focus:border-ink placeholder:text-muted"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tell us what you thought (optional)"
        rows={3}
        className="w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-line outline-none resize-y font-[inherit] transition-colors focus:border-ink placeholder:text-muted"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-line outline-none transition-colors focus:border-ink placeholder:text-muted"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-line outline-none transition-colors focus:border-ink placeholder:text-muted"
        />
      </div>

      {error && <p className="text-[12px] text-accent-dark">{error}</p>}

      <div className="flex gap-5 items-center pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-ink hover:bg-accent-dark text-white text-[12px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
