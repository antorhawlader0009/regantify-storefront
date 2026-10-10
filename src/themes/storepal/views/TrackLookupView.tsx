'use client';

import { useEffect, useState } from 'react';
import { trackOrder } from '@/lib/checkoutApi';
import { useTrackOrder } from '@/lib/useTrackOrder';
import { useLiveOrder } from '@/lib/useLiveOrder';
import { ui, useTrackLang } from '@/lib/trackingI18n';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { TrackOrderBody } from '../components/TrackOrderBody';
import { LangToggle } from './TrackOrderView';
import type { TrackedOrder } from '@/lib/checkoutApi';

/** The looked-up order, refreshing itself once a minute while it is still moving. */
function LiveResult({
  subdomain,
  order,
  phone,
  whatsappUrl,
  lang,
}: {
  subdomain: string;
  order: TrackedOrder;
  phone: string;
  whatsappUrl: string | null;
  lang: ReturnType<typeof useTrackLang>[0];
}) {
  const reference = order.publicCode ?? order.invoiceNumber;
  const live = useLiveOrder(order, () => trackOrder(subdomain, reference, phone));
  return (
    <TrackOrderBody
      order={live.order}
      lang={lang}
      whatsappUrl={whatsappUrl}
      checkedAt={live.checkedAt}
      live={!live.finished}
      subdomain={subdomain}
      onOrderChanged={live.replace}
    />
  );
}

/**
 * StorePal's "Track your order" page (tracking-plan.md Step 4): the order number + phone lookup, with
 * the same result screen as the private link. It replaces the Medium view StorePal used to borrow here.
 * An order placed a moment ago (checkout handoff) opens straight away, and past lookups are remembered
 * in this browser so the shopper does not retype them.
 */
export function TrackLookupView({ subdomain }: { subdomain: string }) {
  const [lang, setLang] = useTrackLang();
  const storeName = useStoreDisplayName(subdomain);
  const { invoiceNumber, setInvoiceNumber, phone, setPhone, loading, error, order, justPlaced, handleSubmit, rememberedOrders, selectRememberedOrder } =
    useTrackOrder(subdomain);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});
  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  useEffect(() => {
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
    getStoreNavData(subdomain).then(setNav);
  }, [subdomain]);

  // The phone the order was looked up with, so the refresh keeps using it even if the box is edited afterwards.
  const [lookedUpPhone, setLookedUpPhone] = useState('');
  useEffect(() => {
    if (order) setLookedUpPhone(phone.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const inputClass =
    'w-full rounded-md border border-line-strong bg-canvas px-3 min-h-[44px] text-[14px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[24px] font-bold text-ink">{justPlaced && order ? ui(lang, 'thanks') : ui(lang, 'trackYourOrder')}</h1>
            {!order && <p className="text-[13px] text-muted mt-1">{ui(lang, 'lookupIntro')}</p>}
          </div>
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-canvas p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end mb-5">
          <label className="block">
            <span className="block text-[12px] font-medium text-muted mb-1">{ui(lang, 'orderNumber')}</span>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. FAS-261003-7K3M9QD"
              autoCapitalize="characters"
              autoComplete="off"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-muted mb-1">{ui(lang, 'phoneNumber')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" className={inputClass} />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] rounded-md bg-ink px-5 text-[13.5px] font-bold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? ui(lang, 'looking') : ui(lang, 'trackButton')}
          </button>
        </form>

        {error && !loading && (
          <p role="alert" className="mb-5 rounded-md border border-line-strong bg-surface px-3 py-2.5 text-[13px] text-ink">
            {error}
          </p>
        )}

        {order ? (
          <LiveResult subdomain={subdomain} order={order} phone={lookedUpPhone || phone.trim()} whatsappUrl={socialLinks.whatsappUrl ?? null} lang={lang} />
        ) : (
          rememberedOrders.length > 0 && (
            <section>
              <h2 className="text-[13px] font-bold text-ink mb-2">{ui(lang, 'recentOrders')}</h2>
              <ul className="space-y-2">
                {rememberedOrders.map((r) => (
                  <li key={`${r.invoiceNumber}-${r.phone}`}>
                    <button
                      type="button"
                      onClick={() => selectRememberedOrder(r)}
                      className="w-full min-h-[44px] rounded-md border border-line bg-canvas px-3 py-2 text-left text-[13px] font-medium text-ink hover:bg-surface"
                    >
                      {r.code ?? `ORDER-${r.invoiceNumber}`}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        )}
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
