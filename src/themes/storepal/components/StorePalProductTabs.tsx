'use client';

import { useEffect, useRef, useState } from 'react';
import { Stars } from '../../medium/components/Stars';
import {
  getProductReviews,
  getReviewPhotoEligibility,
  submitProductReview,
  submitProductReviewWithPhotos,
  voteReviewHelpful,
  type ProductReview,
} from '@/lib/reviewsApi';
import { MAX_REVIEW_PHOTOS, shrinkReviewPhoto } from '@/lib/reviewPhotos';
import { MAX_REVIEW_VIDEO_MB, REVIEW_VIDEO_ACCEPT, reviewVideoProblem } from '@/lib/reviewVideo';
import { variantUrl } from '@/lib/imageVariants';
import { PhotoViewer } from '@/components/ProductImageViewer';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { useAuthDialog } from '../lib/authDialog';
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
  // A review's photos open full screen (shared PhotoViewer); null = closed.
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null);
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
                        <button
                          key={i}
                          type="button"
                          onClick={() => setViewer({ photos: r.photos.map((u) => variantUrl(u, 1280) ?? u), index: i })}
                          aria-label={t('Photos from this review')}
                          className="rounded overflow-hidden border border-line"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- the small saved copy (about 15 KB), not the full photo */}
                          <img src={variantUrl(url, 160) ?? url} alt="" loading="lazy" className="w-16 h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {r.videoUrl && (
                    // The buyer's own video; only its first frame loads until it is played.
                    <video
                      src={r.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={t('Video from this review')}
                      className="mt-2 w-full max-w-[280px] max-h-[360px] rounded border border-line bg-black"
                    />
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

          <PhotoViewer
            photos={viewer?.photos ?? []}
            index={viewer ? viewer.index : null}
            onIndexChange={(k) => setViewer((v) => (v ? { ...v, index: k } : v))}
            onClose={() => setViewer(null)}
            title={t('Photos from this review')}
            labels={{ close: t('Close'), previous: t('Previous photo'), next: t('Next photo'), zoomIn: t('Zoom in'), zoomOut: t('Zoom out') }}
          />

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

  // Photos (TellMe idea 2): only for a shopper signed in here whose own account bought this product; the server checks again on submit.
  const t = useStoreText();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const openLogin = useAuthDialog((s) => s.openLogin);
  const [canAddPhotos, setCanAddPhotos] = useState(false);
  const [photos, setPhotos] = useState<{ blob: Blob; preview: string }[]>([]);
  const [shrinking, setShrinking] = useState(false);
  // One video as well, when the store's plan allows it (Advance) and the server says this buyer may.
  const [canAddVideo, setCanAddVideo] = useState(false);
  const [video, setVideo] = useState<{ file: File; preview: string } | null>(null);
  useEffect(() => {
    if (!open || !accessToken) {
      setCanAddPhotos(false);
      setCanAddVideo(false);
      return;
    }
    let live = true;
    void getReviewPhotoEligibility(subdomain, slug, accessToken).then((r) => {
      if (!live) return;
      setCanAddPhotos(r.canAddPhotos);
      setCanAddVideo(!!r.canAddVideo);
    });
    return () => {
      live = false;
    };
  }, [open, accessToken, subdomain, slug]);
  useEffect(() => {
    if (open && !name && customer?.fullName) setName(customer.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill the name once when the form opens, never over what was typed
  }, [open, customer?.fullName]);
  // Local previews are freed when the form goes away.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);
  const videoRef = useRef(video);
  videoRef.current = video;
  useEffect(() => () => {
    if (videoRef.current) URL.revokeObjectURL(videoRef.current.preview);
  }, []);

  const pickVideo = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const problem = reviewVideoProblem(file);
    if (problem === 'type') {
      setError(t('Please choose an MP4, MOV or WebM video.'));
      return;
    }
    if (problem === 'size') {
      setError(t('The video must be {mb} MB or smaller.').replace('{mb}', String(MAX_REVIEW_VIDEO_MB)));
      return;
    }
    if (video) URL.revokeObjectURL(video.preview);
    setVideo({ file, preview: URL.createObjectURL(file) });
  };
  const removeVideo = () => {
    if (video) URL.revokeObjectURL(video.preview);
    setVideo(null);
  };

  const addPhotos = async (files: File[]) => {
    setError(null);
    setShrinking(true);
    const next = [...photos];
    for (const file of files) {
      if (next.length >= MAX_REVIEW_PHOTOS) break;
      const blob = await shrinkReviewPhoto(file);
      if (!blob) {
        setError(t('Could not open that picture. Please try another photo.'));
        continue;
      }
      next.push({ blob, preview: URL.createObjectURL(blob) });
    }
    setPhotos(next);
    setShrinking(false);
  };
  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos(photos.filter((_, k) => k !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !name.trim()) {
      setError('Please enter your name and a review title.');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        content: content.trim() || undefined,
        rating,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
        orderToken,
      };
      const sendVideo = video && canAddVideo ? video.file : null;
      if ((photos.length > 0 || sendVideo) && canAddPhotos && accessToken) {
        await submitProductReviewWithPhotos(subdomain, slug, input, photos.map((p) => p.blob), accessToken, sendVideo);
      } else {
        await submitProductReview(subdomain, slug, input);
      }
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

      {canAddPhotos ? (
        <div>
          <p className="text-[12px] text-muted mb-1.5">{t('You bought this. Add up to 2 photos of what you got.')}</p>
          <div className="flex gap-2 items-center">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the shrunk photo */}
                <img src={p.preview} alt="" className="w-16 h-16 rounded object-cover border border-line" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={t('Remove photo')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] leading-5 text-center"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_REVIEW_PHOTOS && (
              <label
                className={`w-16 h-16 rounded border border-dashed border-line flex flex-col items-center justify-center text-[10.5px] text-muted text-center cursor-pointer hover:border-ink ${shrinking ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <span className="text-[18px] leading-none">+</span>
                {t('Add photos')}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    e.target.value = '';
                    void addPhotos(picked);
                  }}
                />
              </label>
            )}
          </div>
          {canAddVideo && (
            <div className="mt-3">
              <p className="text-[12px] text-muted mb-1.5">
                {t('You can also add one short video (up to {mb} MB).').replace('{mb}', String(MAX_REVIEW_VIDEO_MB))}
              </p>
              {video ? (
                <div className="relative inline-block">
                  <video src={video.preview} controls playsInline preload="metadata" className="w-48 max-h-40 rounded border border-line bg-black" />
                  <button
                    type="button"
                    onClick={removeVideo}
                    aria-label={t('Remove video')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] leading-5 text-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-line text-[12px] text-muted cursor-pointer hover:border-ink">
                  <span className="text-[16px] leading-none">+</span>
                  {t('Add a video')}
                  <input
                    type="file"
                    accept={REVIEW_VIDEO_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const picked = e.target.files?.[0];
                      e.target.value = '';
                      pickVideo(picked);
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      ) : accessToken ? (
        <p className="text-[12px] text-muted">{t('Photos can be added by customers who bought this with their account.')}</p>
      ) : (
        <p className="text-[12px] text-muted">
          {t('Bought this with your account? Sign in to add photos.')}{' '}
          <button type="button" onClick={openLogin} className="font-semibold text-ink underline">
            {t('Sign in')}
          </button>
        </p>
      )}

      {error && <p className="text-[12px] text-accent">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || shrinking}
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
