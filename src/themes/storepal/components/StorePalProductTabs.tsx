'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
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
import { ReportButton } from './ReportButton';
import { PostingTermsNote } from './PostingTermsNote';

/**
 * StorePal's own copy of Medium's product tabs (Medium/Minimal are never edited for StorePal), kept in step by hand.
 * The one difference: a review the store has answered shows the store's reply under it (Reviews > Edit review > Your
 * reply). Rendered inside the parent page's own bordered card - no outer section/border/max-width here, this is just
 * the tab content.
 */
export function StorePalProductTabs({
  subdomain,
  slug,
  description,
  infoTabs,
  look,
}: {
  subdomain: string;
  slug: string;
  description?: string | null;
  infoTabs?: { title: string; text: string }[] | null;
  /** PlayMate and Solevo draw the same content as the template's stacked sections (details, customer reviews, questions). */
  look?: 'playmate' | 'solevo' | 'chicwove' | 'chronics';
}) {
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
  // ?review=1 (Account > My purchases, before delivery): open the review form too, without the verified-buyer proof.
  const [reviewAsked, setReviewAsked] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('order');
    if (token) {
      setOrderToken(token);
      setActiveTab('reviews');
    } else if (query.get('review') === '1') {
      setReviewAsked(true);
      setActiveTab('reviews');
    }
  }, []);
  // The stars under the product name open this tab and bring it into view.
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const open = () => {
      setActiveTab('reviews');
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('storepal:open-reviews', open);
    return () => window.removeEventListener('storepal:open-reviews', open);
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

  if (look === 'playmate' || look === 'solevo' || look === 'chicwove' || look === 'chronics') {
    return (
      <PlaymateProductSections
        subdomain={subdomain}
        slug={slug}
        description={description}
        extraTabs={extraTabs}
        reviews={reviews}
        reviewsError={reviewsError}
        sort={sort}
        onSort={setSort}
        voted={voted}
        onVote={(id) => void vote(id)}
        onPhotos={(photos, index) => setViewer({ photos, index })}
        viewer={viewer}
        onViewer={setViewer}
        questions={questions}
        questionsError={questionsError}
        orderToken={orderToken}
        reviewAsked={reviewAsked}
        reviewsRef={tabsRef}
      />
    );
  }

  return (
    <div ref={tabsRef} data-rg="product-tabs" className="p-4 sm:p-6 scroll-mt-24">
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
            <p className="text-[13px] text-muted mb-4">No reviews yet - be the first to write one.</p>
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
                  <ReportButton subdomain={subdomain} kind="REVIEW" targetId={r.id} className="ml-3" />
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

          <WriteReviewForm subdomain={subdomain} slug={slug} orderToken={orderToken} autoOpen={reviewAsked} />
        </div>
      )}
    </div>
  );
}

function WriteReviewForm({ subdomain, slug, orderToken, autoOpen }: { subdomain: string; slug: string; orderToken?: string; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const openField =
    'w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none transition-colors focus:border-ink focus:bg-surface';
  const lockedField = 'w-full cursor-not-allowed px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-dashed border-line-strong text-muted outline-none';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Photos (TellMe idea 2): only for a shopper signed in here whose own account bought this product; the server checks again on submit.
  const t = useStoreText();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const openLogin = useAuthDialog((s) => s.openLogin);
  // The signed-in account's own name and email (Edit Profile / Google): shown locked instead of a box to type in.
  const accountName = customer?.fullName?.trim() || '';
  const accountEmail = customer?.email?.trim() || '';
  // Whether this shopper may review at all (a delivered order of this product, not yet reviewed), asked as soon as they are
  // signed in, so the form is only offered to them; null while unknown.
  const [canReview, setCanReview] = useState<boolean | null>(null);
  // Arriving from Account > My purchases (or the tracking page's "Review your products") with ?order=...: the form opens
  // by itself, with the account's name filled in.
  useEffect(() => {
    // ?review=1 opens it only for a buyer who may review (canReview); a ?order= link proves the order itself.
    if (accessToken && (orderToken || (autoOpen && canReview))) setOpen(true);
  }, [orderToken, autoOpen, accessToken, canReview]);
  useEffect(() => {
    if (customer?.fullName) setName((prev) => prev || customer.fullName || '');
  }, [customer?.fullName]);
  const [canAddPhotos, setCanAddPhotos] = useState(false);
  const [photos, setPhotos] = useState<{ blob: Blob; preview: string }[]>([]);
  const [shrinking, setShrinking] = useState(false);
  // One video as well, when the store's plan allows it (Advance) and the server says this buyer may.
  const [canAddVideo, setCanAddVideo] = useState(false);
  const [video, setVideo] = useState<{ file: File; preview: string } | null>(null);
  useEffect(() => {
    if (!accessToken) {
      setCanReview(null);
      setCanAddPhotos(false);
      setCanAddVideo(false);
      return;
    }
    let live = true;
    void getReviewPhotoEligibility(subdomain, slug, accessToken).then((r) => {
      if (!live) return;
      setCanReview(!!r.canReview);
      setCanAddPhotos(r.canAddPhotos);
      setCanAddVideo(!!r.canAddVideo);
    });
    return () => {
      live = false;
    };
  }, [accessToken, subdomain, slug]);
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
    if (!title.trim() || !(accountName || name).trim()) {
      setError('Please enter your name and a review title.');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        content: content.trim() || undefined,
        rating,
        customerName: (accountName || name).trim(),
        customerEmail: (accountEmail || email).trim() || undefined,
        orderToken,
      };
      const sendVideo = video && canAddVideo ? video.file : null;
      if (!accessToken) {
        openLogin();
        return;
      }
      if ((photos.length > 0 || sendVideo) && canAddPhotos) {
        await submitProductReviewWithPhotos(subdomain, slug, input, photos.map((p) => p.blob), accessToken, sendVideo);
      } else {
        await submitProductReview(subdomain, slug, input, accessToken);
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
        Thanks for your review - it&apos;ll show up here once the store approves it.
      </div>
    );
  }

  // Only a shopper signed in on this store can review (the server refuses a guest).
  if (!accessToken) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openLogin}
          className="px-4 py-2 rounded-md border border-line text-[12.5px] font-semibold text-ink hover:border-ink transition-colors"
        >
          {t('Log in to write a review')}
        </button>
        <span className="text-[12px] text-muted">{t('Only customers with an account can write reviews.')}</span>
      </div>
    );
  }

  // Only a buyer whose order of this product was delivered may review it (the server refuses anyone else). A "Review your products"
  // link (?order=) proves that order by itself.
  const mayReview = canReview === true || !!orderToken;
  if (!open && !mayReview) {
    return canReview === null ? null : (
      <p className="m-0 text-[12.5px] text-muted">{t('You can review this product once it has been delivered to you.')}</p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md border border-line text-[12.5px] font-semibold text-ink hover:border-ink transition-colors"
      >
        {t('Write a review')}
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
      {/* The name is the account's and can't be changed here; the email too when the account has one (the owner's rule). The
          server uses the account's name and email anyway. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={accountName || name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!!accountName}
          aria-label={t('Your name')}
          placeholder={t('Your name')}
          className={accountName ? lockedField : openField}
        />
        <input
          type="email"
          value={accountEmail || email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!accountEmail}
          aria-label={t('Email (optional)')}
          placeholder={t('Email (optional)')}
          className={accountEmail ? lockedField : openField}
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

      <PostingTermsNote subdomain={subdomain} />

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

/**
 * PlayMate's product page sections (the template's ProductDetail, below the buy box): the product's own details and
 * extra information, "Customer reviews" with a summary box (the real average and how many gave each star) beside the
 * list, the write-a-review box, and the answered questions. Same data and rules as StorePal's tabs.
 */
function PlaymateProductSections({
  subdomain,
  slug,
  description,
  extraTabs,
  reviews,
  reviewsError,
  sort,
  onSort,
  voted,
  onVote,
  onPhotos,
  viewer,
  onViewer,
  questions,
  questionsError,
  orderToken,
  reviewAsked,
  reviewsRef,
}: {
  subdomain: string;
  slug: string;
  description?: string | null;
  extraTabs: { title: string; text: string }[];
  reviews: ProductReview[] | null;
  reviewsError: string | null;
  sort: 'newest' | 'helpful';
  onSort: (s: 'newest' | 'helpful') => void;
  voted: Set<string>;
  onVote: (id: string) => void;
  onPhotos: (photos: string[], index: number) => void;
  viewer: { photos: string[]; index: number } | null;
  onViewer: (v: { photos: string[]; index: number } | null) => void;
  questions: ProductQuestion[] | null;
  questionsError: string | null;
  orderToken?: string;
  reviewAsked: boolean;
  reviewsRef: RefObject<HTMLDivElement | null>;
}) {
  const t = useStoreText();
  const heading = 'border-b-2 border-accent pb-3 text-[15px] font-bold';
  const list = reviews ?? [];
  const total = list.length;
  const avg = total ? list.reduce((a, r) => a + r.rating, 0) / total : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => list.filter((r) => r.rating === n).length);
  const [detailTab, setDetailTab] = useState(0);
  const details = [
    ...(description ? [{ title: t('Description'), html: description }] : []),
    ...extraTabs.map((x) => ({ title: x.title, html: x.text })),
  ];
  const dateLocale = typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'bn-BD-u-nu-latn' : 'en-US';

  return (
    <div data-rg="product-tabs">
      {details.length > 0 && (
        <section className="mt-12" aria-label={t('Product details')}>
          <div className="flex gap-6 overflow-x-auto whitespace-nowrap border-b-2 border-accent">
            {details.map((d, i) => (
              <button
                key={d.title + i}
                type="button"
                onClick={() => setDetailTab(i)}
                className={`pb-3 text-[15px] font-bold transition ${detailTab === i ? 'text-ink' : 'text-muted hover:text-ink'}`}
              >
                {d.title}
              </button>
            ))}
          </div>
          <div
            className="mt-5 max-w-3xl text-[13.5px] leading-relaxed text-ink/85 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            // The store's own editor text, cleaned when saved.
            dangerouslySetInnerHTML={{ __html: details[Math.min(detailTab, details.length - 1)]?.html ?? '' }}
          />
        </section>
      )}

      <section ref={reviewsRef} className="mt-12 scroll-mt-24" aria-labelledby="pm-rev-title">
        <h2 id="pm-rev-title" className={heading}>
          {t('Customer reviews')} ({total})
        </h2>
        {reviewsError && <p className="mt-4 text-[13px] text-red-600">{reviewsError}</p>}

        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <div className="rounded-lg bg-[var(--pm-card)] p-5">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-extrabold">{total ? avg.toFixed(1) : '0.0'}</span>
              <div>
                <Stars count={Math.round(avg)} />
                <p className="mt-1 text-[11px] text-muted">{t('Based on {n} reviews').replace('{n}', String(total))}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {counts.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-[12px]">
                  <span className="w-12 shrink-0">
                    {5 - i} {t('star')}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? (c / total) * 100 : 0}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right text-muted">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {reviews === null && !reviewsError && <p className="text-[13px] text-muted">{t('Loading reviews...')}</p>}
            {reviews && total === 0 && <p className="text-[13px] text-muted">{t('No reviews yet. Be the first to write one.')}</p>}
            {total > 1 && (
              <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
                <label htmlFor="pm-review-sort">{t('Sort by')}</label>
                <select
                  id="pm-review-sort"
                  value={sort}
                  onChange={(e) => onSort(e.target.value as 'newest' | 'helpful')}
                  className="rounded-md border border-line-strong bg-white px-2 py-1 text-ink"
                >
                  <option value="newest">{t('Newest')}</option>
                  <option value="helpful">{t('Most helpful')}</option>
                </select>
              </div>
            )}
            {total > 0 && (
              <ul
                className="pm-no-scrollbar max-h-[420px] space-y-5 overflow-y-auto overscroll-contain pr-1"
                tabIndex={total > 3 ? 0 : undefined}
                aria-label={t('Customer reviews')}
              >
                {list.map((r) => {
                  const name = r.customerName ?? t('Anonymous');
                  return (
                    <li key={r.id} className="flex gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-light text-xs font-bold text-accent">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 text-[13px]">
                          <b>{name}</b>
                          <Stars count={r.rating} />
                          <span className="text-[11px] text-muted">
                            {new Date(r.createdAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {r.verified && <span className="text-[10px] font-semibold uppercase tracking-wide text-green-600">{t('Verified buyer')}</span>}
                          {r.featured && <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">{t('Featured')}</span>}
                        </p>
                        {r.title && <p className="mt-1 text-[13px] font-semibold">{r.title}</p>}
                        {r.content && <p className="mt-1 text-[13px] text-ink/85">{r.content}</p>}
                        {r.photos.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {r.photos.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onPhotos(r.photos.map((u) => variantUrl(u, 1280) ?? u), i)}
                                aria-label={t('Photos from this review')}
                                className="overflow-hidden rounded-md bg-[var(--pm-card)]"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- the small saved copy */}
                                <img src={variantUrl(url, 160) ?? url} alt="" loading="lazy" className="h-16 w-16 object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                        {r.videoUrl && (
                          <video
                            src={r.videoUrl}
                            controls
                            playsInline
                            preload="metadata"
                            aria-label={t('Video from this review')}
                            className="mt-2 max-h-[360px] w-full max-w-[280px] rounded-md bg-black"
                          />
                        )}
                        {r.replyText && (
                          <div className="mt-2 rounded-md border-l-2 border-accent bg-[var(--pm-card)] px-3 py-2">
                            <p className="text-[11.5px] font-bold">{t('Reply from the store')}</p>
                            <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink/85">{r.replyText}</p>
                          </div>
                        )}
                        <div className="mt-1.5 flex items-center gap-3">
                          <button
                            type="button"
                            className="rounded text-[11px] text-muted hover:text-accent disabled:opacity-70"
                            aria-pressed={voted.has(r.id)}
                            disabled={voted.has(r.id)}
                            onClick={() => onVote(r.id)}
                          >
                            {voted.has(r.id) ? t('Thanks') : t('Was this review helpful?')} {(r.helpfulCount ?? 0) > 0 ? `(${r.helpfulCount})` : ''}
                          </button>
                          <ReportButton subdomain={subdomain} kind="REVIEW" targetId={r.id} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {total > 3 && <p className="mt-3 text-[11px] text-muted">{t('Scroll to see all {n} reviews').replace('{n}', String(total))}</p>}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-line">
          <div className="bg-accent-light px-5 py-3">
            <h3 className="text-sm font-bold">{t('Write a review')}</h3>
            <p className="text-[12px] text-ink/70">{t('Share what you think about this product.')}</p>
          </div>
          <div className="p-5">
            <WriteReviewForm subdomain={subdomain} slug={slug} orderToken={orderToken} autoOpen={reviewAsked} />
          </div>
        </div>

        <PhotoViewer
          photos={viewer?.photos ?? []}
          index={viewer ? viewer.index : null}
          onIndexChange={(k) => onViewer(viewer ? { ...viewer, index: k } : viewer)}
          onClose={() => onViewer(null)}
          title={t('Photos from this review')}
          labels={{ close: t('Close'), previous: t('Previous photo'), next: t('Next photo'), zoomIn: t('Zoom in'), zoomOut: t('Zoom out') }}
        />
      </section>

      <section className="mt-12" aria-labelledby="pm-q-title">
        <h2 id="pm-q-title" className={heading}>
          {t('Questions')} {questions && questions.length > 0 ? `(${questions.length})` : ''}
        </h2>
        <div className="mt-5 max-w-3xl">
          <ProductQuestionsTab subdomain={subdomain} slug={slug} questions={questions} error={questionsError} />
        </div>
      </section>
    </div>
  );
}
