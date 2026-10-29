'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, RotateCcw, ShoppingBag, Star } from 'lucide-react';
import { encodeCartLink } from '@/lib/cartLink';
import { fetchSharedCart } from '@/lib/checkoutApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { deleteOwnReview, fetchCustomerPurchases, updateOwnReview, type CustomerPurchase } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { useStoreText } from '../../lib/storeText';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { useStorePalDesign } from '../../lib/designSettings';

/**
 * Account > My purchases: every product the shopper bought here with their account, newest first, with the sizes and
 * colours they took. A delivered product they haven't reviewed gets "Write a review", which opens the product page's
 * review form as a verified buyer (?order=<tracking token>); a reviewed one shows their stars. Server
 * ReviewsService.purchasesForCustomer decides what can be reviewed.
 */
export function PurchasesView({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const storeName = useStoreDisplayName(subdomain);
  const design = useStorePalDesign();
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<CustomerPurchase[] | null>(null);
  const [error, setError] = useState(false);
  // The review being edited, or the one asking "delete?" (one at a time).
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // "Buy again" per product: busy, added, or why it could not go in the cart.
  const addLine = useCartStore((s) => s.addLine);
  const [again, setAgain] = useState<Record<string, 'busy' | 'added' | 'soldOut' | 'choose'>>({});

  // One piece of the same size/colour as last time, at today's price and stock (looked up like a shared cart link).
  const buyAgain = async (key: string, it: CustomerPurchase) => {
    if (!it.slug) return;
    setAgain((s) => ({ ...s, [key]: 'busy' }));
    try {
      const code = encodeCartLink([{ productSlug: it.slug, quantity: 1, selectedOptions: it.lastOptions ?? {} }]);
      const cart = await fetchSharedCart(subdomain, code);
      const line = cart.status === 'OK' ? cart.lines[0] : undefined;
      if (!line) {
        const soldOut = cart.status === 'OK' && cart.notices.some((n) => n.reason === 'SOLD_OUT');
        setAgain((s) => ({ ...s, [key]: soldOut ? 'soldOut' : 'choose' }));
        return;
      }
      addLine({
        subdomain,
        storeName,
        productSlug: line.productSlug,
        name: line.name,
        image: line.image ?? undefined,
        unitPrice: line.unitPrice,
        originalUnitPrice: line.originalUnitPrice ?? undefined,
        quantity: line.quantity,
        selectedOptions: line.selectedOptions,
        isPreOrder: line.isPreOrder,
        minOrderQuantity: line.minOrderQuantity,
        quantityStep: line.quantityStep,
        productId: line.productId,
        variantId: line.variantId ?? undefined,
      });
      setAgain((s) => ({ ...s, [key]: 'added' }));
    } catch {
      setAgain((s) => ({ ...s, [key]: 'choose' }));
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    let live = true;
    setError(false);
    fetchCustomerPurchases(subdomain, accessToken)
      .then((rows) => live && setItems(rows))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [subdomain, accessToken, reload]);

  const removeReview = async (reviewId: string) => {
    if (!accessToken) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteOwnReview(subdomain, accessToken, reviewId);
      setDeleting(null);
      setReload((n) => n + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const dateText = (iso: string) =>
    new Date(iso).toLocaleDateString(design.storeLanguage === 'bn' ? 'bn-BD-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <ShoppingBag size={26} className="mx-auto text-muted mb-3" aria-hidden />
          <p className="text-[14px] text-ink font-semibold mb-1">{t('Log in to see your orders')}</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            {t('Log in')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-1">{t('My purchases')}</h1>
      <p className="text-[13px] text-muted mb-5">{t('Everything you have bought from this store.')}</p>

      {error && <p className="text-[13px] text-accent-dark">{t('Could not load your purchases.')}</p>}
      {!error && items === null && <p className="text-[13px] text-muted">{t('Loading…')}</p>}
      {items && items.length === 0 && (
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <ShoppingBag size={26} className="mx-auto text-muted mb-3" aria-hidden />
          <p className="text-[14px] text-ink">{t('You have not bought anything here yet.')}</p>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="m-0 p-0 list-none divide-y divide-line rounded-lg border border-line bg-surface">
          {items.map((it) => {
            const href = it.slug ? `/store/${subdomain}/p/${it.slug}` : null;
            const key = it.productId ?? it.name;
            const state = again[key];
            return (
              <li key={key} className="flex flex-wrap gap-3 p-4 sm:flex-nowrap">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-canvas">
                  {it.photo && <Image src={it.photo} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link href={href} className="text-[14px] font-semibold text-ink hover:text-accent line-clamp-2">
                      {it.name}
                    </Link>
                  ) : (
                    <p className="m-0 text-[14px] font-semibold text-ink line-clamp-2">{it.name}</p>
                  )}
                  {it.options.length > 0 && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{it.options.join(', ')}</p>}
                  <p className="m-0 mt-0.5 text-[12px] text-muted">
                    {t('Last bought')}: {dateText(it.lastBoughtAt)}
                    {it.orders > 1 ? ` · ${t('Bought {n} times').replace('{n}', String(it.orders))}` : ''}
                  </p>

                  <div className="mt-2">
                    {it.review && editing === it.review.id && accessToken ? (
                      <OwnReviewForm
                        review={it.review}
                        onCancel={() => setEditing(null)}
                        onSave={async (input) => {
                          await updateOwnReview(subdomain, accessToken, it.review!.id, input);
                          setEditing(null);
                          setReload((n) => n + 1);
                        }}
                      />
                    ) : it.review ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                          <span className="inline-flex text-amber-400" aria-label={`${it.review.rating} / 5`}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={13} fill={n <= it.review!.rating ? 'currentColor' : 'none'} strokeWidth={n <= it.review!.rating ? 0 : 1.5} />
                            ))}
                          </span>
                          {it.review.approved ? t('Reviewed') : t('Waiting for approval')}
                        </span>
                        {it.review.editable && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12.5px]">
                            {deleting === it.review.id ? (
                              <>
                                <span className="text-ink">{t('Delete your review?')}</span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => removeReview(it.review!.id)}
                                  className="font-semibold text-accent hover:underline disabled:opacity-60"
                                >
                                  {t('Yes, delete')}
                                </button>
                                <button type="button" onClick={() => setDeleting(null)} className="text-muted hover:underline">
                                  {t('Cancel')}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError(null);
                                    setDeleting(null);
                                    setEditing(it.review!.id);
                                  }}
                                  className="font-semibold text-ink hover:underline"
                                >
                                  {t('Edit review')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError(null);
                                    setEditing(null);
                                    setDeleting(it.review!.id);
                                  }}
                                  className="text-muted hover:text-accent hover:underline"
                                >
                                  {t('Delete review')}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {actionError && deleting === it.review.id && <p className="m-0 mt-1 text-[12px] text-accent">{actionError}</p>}
                      </div>
                    ) : !it.slug ? (
                      <span className="text-[12px] text-muted">{t('No longer sold here')}</span>
                    ) : null}
                  </div>
                </div>

                {/* Buy again and review, side by side on the right (below the details on a phone). */}
                {href && (
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-44">
                    {state === 'added' ? (
                      <Link
                        href={`/store/${subdomain}/cart`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[13px] font-semibold text-success"
                      >
                        <Check size={15} aria-hidden />
                        {t('Added. View cart')}
                      </Link>
                    ) : state === 'choose' ? (
                      <Link
                        href={href}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-[13px] font-semibold text-ink hover:border-accent hover:text-accent"
                      >
                        {t('Choose options')}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={state === 'busy' || state === 'soldOut'}
                        onClick={() => void buyAgain(key, it)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw size={15} aria-hidden />
                        {state === 'busy' ? t('Adding…') : state === 'soldOut' ? t('Out of stock') : t('Buy again')}
                      </button>
                    )}
                    {!it.review && (
                      <Link
                        href={it.reviewToken ? `${href}?order=${encodeURIComponent(it.reviewToken)}` : `${href}?review=1`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                      >
                        <Star size={15} aria-hidden />
                        {t('Write a review')}
                      </Link>
                    )}
                    {!it.review && !it.received && (
                      <p className="m-0 text-center text-[11.5px] leading-snug text-muted">{t('Verified buyer mark comes after delivery.')}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}

/** Edit one's own review in place: stars, title, text, and taking its photos or video off. */
function OwnReviewForm({
  review,
  onSave,
  onCancel,
}: {
  review: NonNullable<CustomerPurchase['review']>;
  onSave: (input: { title: string; content?: string; rating: number; removePhotos?: boolean; removeVideo?: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useStoreText();
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [content, setContent] = useState(review.content ?? '');
  const [removePhotos, setRemovePhotos] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('Please give your review a title.'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), content: content.trim(), rating, removePhotos, removeVideo });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong. Please try again.'));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-1 space-y-2.5 rounded-md border border-line bg-canvas p-3">
      <div className="flex items-center gap-1 text-amber-400" role="radiogroup" aria-label={t('Your rating')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={n === rating} aria-label={`${n} / 5`} onClick={() => setRating(n)}>
            <Star size={20} fill={n <= rating ? 'currentColor' : 'none'} strokeWidth={n <= rating ? 0 : 1.5} />
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 150))}
        maxLength={150}
        placeholder={t('Review title')}
        className="w-full px-3 py-2 rounded-md border border-line-strong bg-surface text-[13px] outline-none focus:border-ink"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 3000))}
        maxLength={3000}
        rows={3}
        placeholder={t('Your review')}
        className="w-full px-3 py-2 rounded-md border border-line-strong bg-surface text-[13px] outline-none focus:border-ink resize-y"
      />
      {review.photos.length > 0 && (
        <label className="flex items-center gap-2 text-[12.5px] text-ink">
          <input type="checkbox" checked={removePhotos} onChange={(e) => setRemovePhotos(e.target.checked)} />
          {t('Remove my photos')}
        </label>
      )}
      {review.videoUrl && (
        <label className="flex items-center gap-2 text-[12.5px] text-ink">
          <input type="checkbox" checked={removeVideo} onChange={(e) => setRemoveVideo(e.target.checked)} />
          {t('Remove my video')}
        </label>
      )}
      <p className="m-0 text-[12px] text-muted">{t('After you save, the store checks your review again before it shows.')}</p>
      {error && <p className="m-0 text-[12px] text-accent">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-white text-[12.5px] font-bold disabled:opacity-60">
          {saving ? t('Saving…') : t('Save')}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-line-strong text-[12.5px] text-ink">
          {t('Cancel')}
        </button>
      </div>
    </form>
  );
}
