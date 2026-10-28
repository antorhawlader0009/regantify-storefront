'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star } from 'lucide-react';
import { fetchCustomerPurchases, type CustomerPurchase } from '@/lib/customerAuthApi';
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
  }, [subdomain, accessToken]);

  const dateText = (iso: string) =>
    new Date(iso).toLocaleDateString(design.storeLanguage === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });

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
            return (
              <li key={it.productId ?? it.name} className="flex gap-3 p-4">
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
                    {it.review ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                        <span className="inline-flex text-amber-400" aria-label={`${it.review.rating} / 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={13} fill={n <= it.review!.rating ? 'currentColor' : 'none'} strokeWidth={n <= it.review!.rating ? 0 : 1.5} />
                          ))}
                        </span>
                        {it.review.approved ? t('Reviewed') : t('Waiting for approval')}
                      </span>
                    ) : it.reviewToken && href ? (
                      <Link
                        href={`${href}?order=${encodeURIComponent(it.reviewToken)}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-ink px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
                      >
                        <Star size={13} aria-hidden />
                        {t('Write a review')}
                      </Link>
                    ) : !it.slug ? (
                      <span className="text-[12px] text-muted">{t('No longer sold here')}</span>
                    ) : !it.received ? (
                      <span className="text-[12px] text-muted">{t('You can review it once it is delivered.')}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
