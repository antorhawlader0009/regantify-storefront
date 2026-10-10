'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { fetchCartRecovery, type CartRecovery } from '@/lib/checkoutApi';
import { useCartStore } from '@/providers/cart-store-provider';
import { ui, useTrackLang } from '@/lib/trackingI18n';
import { LangToggle } from './TrackOrderView';

const taka = (n: number) => `৳${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const FORM_KEY_PREFIX = 'regantify-checkout-form:';

/**
 * The page behind the cart recovery link in the abandoned-checkout reminder SMS (TellMe idea 40). It puts the shopper's
 * items back in this browser's cart (replacing what the cart held for this store, since this IS that cart), at today's
 * price and stock (the server looks every line up again), fills the checkout form's name, phone and address in, and tells
 * them what could not come back. Theme-independent like the tracking and payment links; the token is the proof of access.
 */
export function RecoverCartView({ subdomain, token, storeName, logoUrl }: { subdomain: string; token: string; storeName: string; logoUrl: string | null }) {
  const router = useRouter();
  const [lang, setLang] = useTrackLang();
  const [data, setData] = useState<CartRecovery | null>(null);
  const addLine = useCartStore((s) => s.addLine);
  const clearStore = useCartStore((s) => s.clearStore);
  // The link may be opened twice by the browser (dev strict mode, a reload): the cart is only put back once per load.
  const restored = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchCartRecovery(subdomain, token)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData({ status: 'NOT_FOUND' }));
    return () => {
      cancelled = true;
    };
  }, [subdomain, token]);

  useEffect(() => {
    if (!data || data.status !== 'OK' || restored.current) return;
    restored.current = true;
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
        productId: l.productId,
        variantId: l.variantId ?? undefined,
      });
    }
    // Fill the checkout form (StorePal's saved-form storage), only where the shopper has not already saved something.
    try {
      const key = `${FORM_KEY_PREFIX}${subdomain}`;
      const existing = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>;
      const merged = {
        ...existing,
        fullName: existing.fullName || data.customer.fullName,
        phone: existing.phone || data.customer.phone,
        address: existing.address || data.customer.address,
      };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch {
      // Storage blocked: checkout simply starts with an empty form.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const ok = data?.status === 'OK' ? data : null;
  const noItems = ok !== null && ok.lines.length === 0;

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
            <p className="text-[14px] text-ink">{ui(lang, 'recUnavailable')}</p>
            <Link href={`/store/${subdomain}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {storeName}
            </Link>
          </div>
        )}

        {data?.status === 'EXPIRED' && (
          <div className="text-center">
            <Clock className="mx-auto mb-3 text-amber-600" size={36} aria-hidden />
            <p className="text-[14px] text-ink">{ui(lang, 'recExpired')}</p>
            <Link href={`/store/${subdomain}`} className="mt-3 inline-block text-[13.5px] font-medium text-accent hover:underline">
              {storeName}
            </Link>
          </div>
        )}

        {data?.status === 'ORDERED' && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 text-success" size={40} aria-hidden />
            <p className="text-[14.5px] font-semibold text-ink">{ui(lang, 'recOrdered')}</p>
          </div>
        )}

        {ok && (
          <div className="rounded-lg border border-line bg-canvas p-5 sm:p-6">
            <h1 className="m-0 text-[20px] font-bold text-ink">{ui(lang, 'recTitle')}</h1>
            {!noItems && <p className="m-0 mt-2 text-[13.5px] text-muted">{ui(lang, 'recIntro')}</p>}

            {noItems ? (
              <p className="m-0 mt-3 text-[13.5px] text-ink">{ui(lang, 'recEmpty')}</p>
            ) : (
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

            {ok.notices.filter((n) => n.reason !== 'REDUCED').length > 0 && (
              <div className="mt-4 rounded-md bg-canvas px-3 py-2 text-[12.5px] text-muted">
                <p className="m-0 font-semibold text-ink">{ui(lang, 'recRemoved')}</p>
                <ul className="m-0 mt-1 list-disc pl-4">
                  {ok.notices
                    .filter((n) => n.reason !== 'REDUCED')
                    .map((n) => (
                      <li key={n.name}>{n.name}</li>
                    ))}
                </ul>
              </div>
            )}
            {ok.notices.filter((n) => n.reason === 'REDUCED').length > 0 && (
              <div className="mt-3 rounded-md bg-canvas px-3 py-2 text-[12.5px] text-muted">
                <p className="m-0 font-semibold text-ink">{ui(lang, 'recReduced')}</p>
                <ul className="m-0 mt-1 list-disc pl-4">
                  {ok.notices
                    .filter((n) => n.reason === 'REDUCED')
                    .map((n) => (
                      <li key={n.name}>
                        {n.name}: {n.available}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {!noItems && (
              <button
                type="button"
                onClick={() => router.push(`/store/${subdomain}/cart`)}
                className="mt-5 flex w-full items-center justify-center rounded-md bg-accent px-4 min-h-[48px] text-[14px] font-bold text-white transition-colors hover:bg-accent-dark"
              >
                {ui(lang, 'recContinue')}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
