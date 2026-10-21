'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, ShoppingBag, XCircle } from 'lucide-react';
import { fetchInstantCheckout, type InstantCheckout } from '@/lib/checkoutApi';
import { setInstantHandoff } from '@/lib/instantCheckout';
import { useCartStore } from '@/providers/cart-store-provider';
import { useTrackLang } from '@/lib/trackingI18n';
import { LangToggle } from './TrackOrderView';
import { setPendingCoupon } from '../lib/pendingCoupon';

const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const TEXT = {
  en: {
    title: 'Your order is ready',
    intro: 'The shop prepared this order for you at today’s prices. Check it and confirm.',
    deliverTo: 'Deliver to',
    confirm: 'Confirm order',
    note: 'Next you choose how to pay and press Place order. You can still change anything.',
    removed: 'Not available any more, so it was left out:',
    reduced: 'Fewer than asked (stock left):',
    empty: 'None of these items are available right now. Please message the shop.',
    bad: 'This link is not valid.',
    expired: 'This link has expired or was cancelled. Please ask the shop for a new one.',
    ordered: 'This order was already placed. Thank you!',
    shop: 'Visit the shop',
    coupon: 'Coupon',
  },
  bn: {
    title: 'আপনার অর্ডার তৈরি',
    intro: 'শপ আপনার জন্য আজকের দামে এই অর্ডারটি তৈরি করেছে। দেখে কনফার্ম করুন।',
    deliverTo: 'ডেলিভারি ঠিকানা',
    confirm: 'অর্ডার কনফার্ম করুন',
    note: 'এরপর পেমেন্টের পদ্ধতি বেছে Place order চাপুন। চাইলে যেকোনো কিছু বদলাতে পারবেন।',
    removed: 'এখন পাওয়া যাচ্ছে না, তাই বাদ দেওয়া হয়েছে:',
    reduced: 'যতটা চাওয়া হয়েছিল তার চেয়ে কম (স্টকে যতটা আছে):',
    empty: 'এই পণ্যগুলোর কোনোটিই এখন পাওয়া যাচ্ছে না। শপকে মেসেজ করুন।',
    bad: 'এই লিংকটি সঠিক নয়।',
    expired: 'এই লিংকের মেয়াদ শেষ বা বাতিল হয়েছে। শপের কাছে নতুন লিংক চান।',
    ordered: 'এই অর্ডারটি আগেই দেওয়া হয়েছে। ধন্যবাদ!',
    shop: 'শপে যান',
    coupon: 'কুপন',
  },
} as const;

/**
 * The page behind an instant checkout link (/i/<token>, server/src/instant-checkout/). The shop prepared the products and
 * the customer's details (from the dashboard or right inside a chat with the Chrome extension). The products are looked up
 * again at today's price and stock, put in this browser's cart (replacing this store's cart, since the link is the order),
 * and the details are handed to the checkout (lib/instantCheckout.ts), so "Confirm order" opens the store's normal checkout
 * already filled in and the customer only picks how to pay. Theme-independent like the cart recovery and payment links.
 */
export function InstantCheckoutView({ subdomain, token, storeName, logoUrl }: { subdomain: string; token: string; storeName: string; logoUrl: string | null }) {
  const router = useRouter();
  const [lang, setLang] = useTrackLang();
  const t = TEXT[lang === 'bn' ? 'bn' : 'en'];
  const [data, setData] = useState<InstantCheckout | null>(null);
  const addLine = useCartStore((s) => s.addLine);
  const clearStore = useCartStore((s) => s.clearStore);
  const prepared = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchInstantCheckout(subdomain, token)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData({ status: 'NOT_FOUND' }));
    return () => {
      cancelled = true;
    };
  }, [subdomain, token]);

  useEffect(() => {
    if (!data || data.status !== 'OK' || prepared.current || data.lines.length === 0) return;
    prepared.current = true;
    clearStore(subdomain);
    for (const l of data.lines) {
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
    setInstantHandoff(subdomain, token, data.customer);
    if (data.couponCode) setPendingCoupon(subdomain, data.couponCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const ok = data?.status === 'OK' ? data : null;
  const total = ok ? ok.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0) : 0;
  const address = ok ? [ok.customer.address, ok.customer.city, ok.customer.district].filter(Boolean).join(', ') : '';

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
        {!data && <Clock className="mx-auto animate-pulse text-muted" size={32} aria-hidden />}

        {data && data.status !== 'OK' && (
          <div className="text-center">
            {data.status === 'ORDERED' ? <CheckCircle2 className="mx-auto mb-3 text-success" size={40} aria-hidden /> : data.status === 'EXPIRED' ? <Clock className="mx-auto mb-3 text-amber-600" size={36} aria-hidden /> : <XCircle className="mx-auto mb-3 text-accent" size={36} aria-hidden />}
            <p className="text-[14px] text-ink">{data.status === 'ORDERED' ? t.ordered : data.status === 'EXPIRED' ? t.expired : t.bad}</p>
            <Link href={`/store/${subdomain}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {t.shop}
            </Link>
          </div>
        )}

        {ok && (
          <div className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <h1 className="m-0 flex items-center gap-2 text-[20px] font-bold text-ink">
              <ShoppingBag size={20} aria-hidden /> {t.title}
            </h1>
            {ok.lines.length === 0 ? (
              <p className="m-0 mt-3 text-[13.5px] text-ink">{t.empty}</p>
            ) : (
              <>
                <p className="m-0 mt-2 text-[13.5px] text-muted">{t.intro}</p>
                <ul className="mt-4 divide-y divide-line">
                  {ok.lines.map((l) => (
                    <li key={`${l.productSlug}-${JSON.stringify(l.selectedOptions)}`} className="flex items-center gap-3 py-2.5">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail from the store's own product photos
                        <img src={l.image} alt="" className="h-12 w-12 shrink-0 rounded border border-line object-cover" />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded bg-surface" />
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
                <p className="m-0 mt-2 flex justify-between border-t border-line pt-2 text-[13.5px] font-semibold text-ink">
                  <span>{lang === 'bn' ? 'পণ্যের মোট' : 'Items total'}</span>
                  <span>{taka(total)}</span>
                </p>
                {(ok.customer.fullName || address) && (
                  <div className="mt-4 rounded-md bg-surface px-3 py-2 text-[13px] text-ink">
                    <p className="m-0 text-[12px] text-muted">{t.deliverTo}</p>
                    <p className="m-0 font-medium">{ok.customer.fullName}</p>
                    {ok.customer.phone && <p className="m-0">{ok.customer.phone}</p>}
                    {address && <p className="m-0">{address}</p>}
                  </div>
                )}
                {ok.couponCode && (
                  <p className="m-0 mt-2 text-[12.5px] text-muted">
                    {t.coupon}: <span className="font-semibold text-ink">{ok.couponCode}</span>
                  </p>
                )}
              </>
            )}

            {ok.notices.length > 0 && (
              <div className="mt-4 rounded-md bg-surface px-3 py-2 text-[12.5px] text-muted">
                {ok.notices.some((n) => n.reason !== 'REDUCED') && (
                  <>
                    <p className="m-0 font-semibold text-ink">{t.removed}</p>
                    <ul className="m-0 mt-1 list-disc pl-5">
                      {ok.notices.filter((n) => n.reason !== 'REDUCED').map((n) => (
                        <li key={n.name}>{n.name}</li>
                      ))}
                    </ul>
                  </>
                )}
                {ok.notices.some((n) => n.reason === 'REDUCED') && (
                  <>
                    <p className="m-0 mt-1 font-semibold text-ink">{t.reduced}</p>
                    <ul className="m-0 mt-1 list-disc pl-5">
                      {ok.notices.filter((n) => n.reason === 'REDUCED').map((n) => (
                        <li key={n.name}>
                          {n.name}: {n.available}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {ok.lines.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/store/${subdomain}/checkout`)}
                  className="mt-5 w-full rounded-md bg-accent px-4 py-3 text-[15px] font-semibold text-white hover:opacity-90"
                >
                  {t.confirm}
                </button>
                <p className="m-0 mt-2 text-center text-[12px] text-muted">{t.note}</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
