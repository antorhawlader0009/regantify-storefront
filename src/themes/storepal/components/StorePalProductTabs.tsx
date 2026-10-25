'use client';

import { useEffect, useState } from 'react';
import { Stars } from '../../medium/components/Stars';
import { getProductReviews, submitProductReview, voteReviewHelpful, type ProductReview } from '@/lib/reviewsApi';
import { getProductQuestions, type ProductQuestion } from '@/lib/questionsApi';
import { useStoreText } from '../lib/storeText';
import { ProductQuestionsTab } from './ProductQuestionsTab';

/**
 * StorePal's own copy of Medium's product tabs (Medium/Minimal are never edited for StorePal), kept in step by hand.
 * The one difference: a review the store has answered shows the store's reply under it (Reviews > Edit review > Your
 * reply). Rendered inside the parent page's own bordered card — no outer section/border/max-width here, this is just
 * the tab content.
 */
export function StorePalProductTabs({ subdomain, slug, description, infoTabs }: { subdomain: string; slug: string; description?: string | null; infoTabs?: { title: string; text: string }[] | null }) {
  const t = useStoreText();
  // Extra information tabs (TellMe idea 119) sit after the description: "info:0", "info:1", "info:2".
  const [activeTab, setActiveTab] = useState<string>('description');
  const extraTabs = (infoTabs ?? []).filter((x) => x.title && x.text);

  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Answered questions (TellMe idea 35); loaded here so the tab can show its count.
  const [questions, setQuestions] = useState<ProductQuestion[] | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  useEffect(() => {
    getProductQuestions(subdomain, slug)
      .then(setQuestions)
      .catch((err) => setQuestionsError(err instanceof Error ? err.message : 'Could not load questions.'));
  }, [subdomain, slug]);

  // "Most helpful" or "Newest" (TellMe idea 99); and the tracking token from a "Review your products" link (?order=...) that proves a purchase.
  const [sort, setSort] = useState<'newest' | 'helpful'>('newest');
  const [orderToken, setOrderToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('order');
    if (token) {
      setOrderToken(token);
      setActiveTab('reviews');
    }
  }, []);
  // Reviews this browser already voted for, so the button reads "Thanks" and a second tap does nothing.
  const [voted, setVoted] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      setVoted(new Set(JSON.parse(localStorage.getItem(`storepal-review-votes:${subdomain}`) ?? '[]') as string[]));
    } catch {
      // Storage blocked: the server still holds one vote per address.
    }
  }, [subdomain]);
  const vote = async (id: string) => {
    if (voted.has(id)) return;
    try {
      const res = await voteReviewHelpful(subdomain, id);
      setReviews((cur) => (cur ? cur.map((r) => (r.id === id ? { ...r, helpfulCount: res.helpfulCount } : r)) : cur));
      const next = new Set(voted).add(id);
      setVoted(next);
      try {
        localStorage.setItem(`storepal-review-votes:${subdomain}`, JSON.stringify([...next].slice(-500)));
      } catch {
        // ignore
      }
    } catch {
      // A failed vote is not worth a message.
    }
  };

  useEffect(() => {
    getProductReviews(subdomain, slug, sort)
      .then(setReviews)
      .catch((err) => setReviewsError(err instanceof Error ? err.message : 'Could not load reviews.'));
  }, [subdomain, slug, sort]);

  return (
    <div data-rg="product-tabs" className="p-4 sm:p-6">
      <div className="flex gap-6 border-b border-line mb-4 overflow-x-auto whitespace-nowrap">
        {['description', ...extraTabs.map((_, i) => `info:${i}`), 'reviews', 'questions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 px-0.5 bg-transparent border-0 text-[13px] font-semibold transition-colors ${
              activeTab === tab ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {tab === 'reviews'
              ? `Reviews${reviews ? ` (${reviews.length})` : ''}`
              : tab === 'questions'
                ? `${t('Questions')}${questions && questions.length > 0 ? ` (${questions.length})` : ''}`
                : tab.startsWith('info:')
                  ? extraTabs[Number(tab.slice(5))]?.title
                  : 'Description'}
            {activeTab === tab && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'description' ? (
        description ? (
          <div className="text-[13px] text-ink/85 leading-relaxed max-w-2xl" dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <p className="text-[13px] text-muted">No description provided for this product.</p>
        )
      ) : activeTab.startsWith('info:') ? (
        <div
          className="text-[13px] text-ink/85 leading-relaxed max-w-2xl [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
          // The text was cleaned when the store saved it (products/info-tabs.ts).
          dangerouslySetInnerHTML={{ __html: extraTabs[Number(activeTab.slice(5))]?.text ?? '' }}
        />
      ) : activeTab === 'questions' ? (
        <ProductQuestionsTab subdomain={subdomain} slug={slug} questions={questions} error={questionsError} />
      ) : (
        <div className="max-w-2xl">
          {reviewsError && <p className="text-[13px] text-accent mb-4">{reviewsError}</p>}

          {!reviewsError && reviews === null && <p className="text-[13px] text-muted mb-4">Loading reviews…</p>}

          {reviews && reviews.length === 0 && (
            <p className="text-[13px] text-muted mb-4">No reviews yet — be the first to write one.</p>
          )}

          {reviews && reviews.length > 1 && (
            <div className="mb-3 flex items-center gap-2 text-[12.5px] text-muted">
              <label htmlFor="review-sort">{t('Sort by')}</label>
              <select id="review-sort" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'helpful')} className="rounded-md border border-line bg-surface px-2 py-1 text-ink">
                <option value="newest">{t('Newest')}</option>
                <option value="helpful">{t('Most helpful')}</option>
              </select>
            </div>
          )}

          {reviews && reviews.length > 0 && (
            <div className="flex flex-col gap-4 mb-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-line pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <Stars count={r.rating} />
                    {r.featured && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">Featured</span>
                    )}
                    {r.verified && <span className="text-[10px] font-semibold uppercase tracking-wide text-success">{t('Verified buyer')}</span>}
                  </div>
                  <p className="mt-1.5 text-[13.5px] font-semibold text-ink">{r.title}</p>
                  {r.content && <p className="mt-1 text-[13px] text-ink/85 leading-relaxed">{r.content}</p>}
                  {r.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.photos.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element -- small user-submitted review photos, not worth next/image's overhead here
                        <img key={i} src={url} alt="" className="w-14 h-14 rounded object-cover border border-line" />
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 text-[12px] text-muted font-medium">{r.customerName ?? 'Anonymous'}</p>
                  <button
                    type="button"
                    onClick={() => void vote(r.id)}
                    disabled={voted.has(r.id)}
                    className="mt-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:text-ink disabled:opacity-70"
                  >
                    {voted.has(r.id) ? t('Thanks') : t('Helpful')}
                    {(r.helpfulCount ?? 0) > 0 ? ` (${r.helpfulCount})` : ''}
                  </button>
                  {r.replyText && (
                    <div className="mt-2.5 rounded-md border-l-2 border-accent bg-canvas px-3 py-2">
                      <p className="m-0 text-[11.5px] font-bold text-ink">{t('Reply from the store')}</p>
                      <p className="m-0 mt-0.5 text-[13px] text-ink/85 leading-relaxed whitespace-pre-line">{r.replyText}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <WriteReviewForm subdomain={subdomain} slug={slug} orderToken={orderToken} />
        </div>
      )}
    </div>
  );
}

function WriteReviewForm({ subdomain, slug, orderToken }: { subdomain: string; slug: string; orderToken?: string }) {
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
        orderToken,
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
      <div className="bg-canvas border border-line rounded-lg p-4 text-[13px] text-ink">
        Thanks for your review — it&apos;ll show up here once the store approves it.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md border border-line text-[12.5px] font-semibold text-ink hover:border-ink transition-colors"
      >
        Write a review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 space-y-3">
      <div>
        <p className="text-[12px] font-semibold text-ink mb-1.5">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-[18px] ${n <= rating ? 'text-[#f5a623]' : 'text-[#ddd]'}`}
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
        className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none transition-colors focus:border-ink focus:bg-surface"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tell us what you thought (optional)"
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none resize-y font-[inherit] transition-colors focus:border-ink focus:bg-surface"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none transition-colors focus:border-ink focus:bg-surface"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none transition-colors focus:border-ink focus:bg-surface"
        />
      </div>

      {error && <p className="text-[12px] text-accent">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-bold disabled:opacity-60 shadow-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-md text-[12.5px] font-semibold text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
