'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, XCircle } from 'lucide-react';
import { fetchSharedCart, resolveCouponLink, type SharedCart } from '@/lib/checkoutApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { useTrackLang } from '@/lib/trackingI18n';
import { LangToggle } from './TrackOrderView';
import { setPendingCoupon } from '../lib/pendingCoupon';

const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const TEXT = {
  en: {
    title: 'A cart for you',
    intro: 'These items are ready at today’s prices and stock.',
    bad: 'This cart link is not valid.',
    empty: 'None of these items are available right now.',
    removed: 'Left out (not available):',
    reduced: 'Fewer than asked (stock left):',
    had: 'You already have items in your cart.',
    replace: 'Replace my cart',
    add: 'Add to my cart',
    go: 'Go to checkout',
    shop: 'Keep shopping',
  },
  bn: {
    title: 'আপনার জন্য কার্ট',
    intro: 'আজকের দাম ও স্টক অনুযায়ী পণ্যগুলো তৈরি আছে।',
    bad: 'এই কার্ট লিংকটি সঠিক নয়।',
    empty: 'এই পণ্যগুলোর কোনোটিই এখন পাওয়া যাচ্ছে না।',
    removed: 'বাদ পড়েছে (পাওয়া যাচ্ছে না):',
    reduced: 'কম দেওয়া হয়েছে (স্টকে যতটা আছে):',
    had: 'আপনার কার্টে আগে থেকেই পণ্য আছে।',
    replace: 'আমার কার্ট বদলে দিন',
    add: 'আমার কার্টে যোগ করুন',
    go: 'চেকআউটে যান',
    shop: 'কেনাকাটা চালিয়ে যান',
  },
} as const;

/**
 * A shared cart link (TellMe idea 77): the vendor's "Cart link" or a shopper's "Share cart". The link holds only slugs, options and
 * quantities; the server looks each line up again at today's price and stock. A cart that already has items is not touched until
 * the shopper chooses to replace it or add to it. `?coupon=` (the coupon link of Marketing > Coupons) rides along.
 */
export function SharedCartView({ subdomain, code, coupon, storeName, logoUrl }: { subdomain: string; code: string; coupon?: string; storeName: string; logoUrl: string | null }) {
  const router = useRouter();
  const [lang, setLang] = useTrackLang();
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  const [data, setData] = useState<SharedCart | null>(null);
  const existing = useCartStore((s) => s.lines.filter((l) => l.subdomain === subdomain).length);
  const addLine = useCartStore((s) => s.addLine);
  const clearStore = useCartStore((s) => s.clearStore);

  useEffect(() => {
    let cancelled = false;
    fetchSharedCart(subdomain, code)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData({ status: 'NOT_FOUND' }));
    return () => {
      cancelled = true;
    };
  }, [subdomain, code]);

  const ok = data?.status === 'OK' ? data : null;
  const noItems = ok !== null && ok.lines.length === 0;

  const put = async (replace: boolean) => {
    if (!ok) return;
    if (replace) clearStore(subdomain);
    for (const l of ok.lines) {
      addLine({
        subdomain,
        storeName,
        productSlug: l.productSlug,
        name: l.name,
        image: l.image ?? undefined,
        unitPrice: l.unitPrice,
        originalUnitPrice: l.originalUnitPrice ?? undefined,
        quantity: l.quantity,
        selectedOptions: l.selectedOptions,
        isPreOrder: l.isPreOrder,
        minOrderQuantity: l.minOrderQuantity,
        quantityStep: l.quantityStep,
        productId: l.productId,
        variantId: l.variantId ?? undefined,
      });
    }
    if (coupon) {
      const resolved = await resolveCouponLink(subdomain, coupon);
      if (resolved) setPendingCoupon(subdomain, resolved);
    }
    router.push(`/store/${subdomain}/cart`);
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex items-center justify-between gap-3">
          <Link href={`/store/${subdomain}`} className="flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={storeName} width={120} height={32} className="h-8 w-auto object-contain" unoptimized />
            ) : (
              <span className="text-[16px] font-bold text-ink truncate">{storeName}</span>
            )}
          </Link>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-8">
        {!data && (
          <p className="text-center text-[13.5px] text-muted">
            <Clock className="mx-auto mb-3 animate-pulse" size={32} aria-hidden />…
          </p>
        )}

        {data?.status === 'NOT_FOUND' && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 text-accent" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{t.bad}</p>
            <Link href={`/store/${subdomain}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {storeName}
            </Link>
          </div>
        )}

        {ok && (
          <div className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <h1 className="m-0 text-[20px] font-bold text-ink">{t.title}</h1>
            {noItems ? <p className="m-0 mt-3 text-[13.5px] text-ink">{t.empty}</p> : <p className="m-0 mt-2 text-[13.5px] text-muted">{t.intro}</p>}

            {!noItems && (
              <ul className="mt-4 divide-y divide-line">
                {ok.lines.map((l) => (
                  <li key={`${l.productSlug}-${JSON.stringify(l.selectedOptions)}`} className="flex items-center gap-3 py-2.5">
                    {l.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail from the store's own product photos
                      <img src={l.image} alt="" className="h-12 w-12 shrink-0 rounded border border-line object-cover" />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded bg-canvas" />
                    )}
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="m-0 truncate font-medium text-ink">{l.name}</p>
                      <p className="m-0 text-muted">
                        {Object.values(l.selectedOptions).filter(Boolean).join(' / ')}
                        {Object.keys(l.selectedOptions).length > 0 ? ' · ' : ''}× {l.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold text-ink">{taka(l.unitPrice * l.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}

            {ok.notices.some((n) => n.reason !== 'REDUCED') && (
              <div className="mt-4 rounded-md bg-canvas px-3 py-2 text-[12.5px] text-muted">
                <p className="m-0 font-semibold text-ink">{t.removed}</p>
                <ul className="m-0 mt-1 list-disc pl-4">
                  {ok.notices.filter((n) => n.reason !== 'REDUCED').map((n, i) => (
                    <li key={`${n.name}-${i}`}>{n.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {ok.notices.some((n) => n.reason === 'REDUCED') && (
              <div className="mt-3 rounded-md bg-canvas px-3 py-2 text-[12.5px] text-muted">
                <p className="m-0 font-semibold text-ink">{t.reduced}</p>
                <ul className="m-0 mt-1 list-disc pl-4">
                  {ok.notices.filter((n) => n.reason === 'REDUCED').map((n, i) => (
                    <li key={`${n.name}-${i}`}>
                      {n.name}: {n.available}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!noItems && existing > 0 && (
              <div className="mt-5 space-y-2">
                <p className="m-0 text-[13px] text-ink">{t.had}</p>
                <button type="button" onClick={() => void put(true)} className="flex w-full items-center justify-center rounded-md bg-accent px-4 min-h-[48px] text-[14px] font-bold text-white transition-colors hover:bg-accent-dark">
                  {t.replace}
                </button>
                <button type="button" onClick={() => void put(false)} className="flex w-full items-center justify-center rounded-md border border-line px-4 min-h-[48px] text-[14px] font-semibold text-ink hover:bg-surface">
                  {t.add}
                </button>
              </div>
            )}
            {!noItems && existing === 0 && (
              <button type="button" onClick={() => void put(true)} className="mt-5 flex w-full items-center justify-center rounded-md bg-accent px-4 min-h-[48px] text-[14px] font-bold text-white transition-colors hover:bg-accent-dark">
                {t.go}
              </button>
            )}
            {noItems && (
              <Link href={`/store/${subdomain}`} className="mt-4 inline-block text-[13.5px] font-medium text-accent hover:underline">
                {t.shop}
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
