'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { TrackedOrder } from '@/lib/checkoutApi';
import { fetchTrackedOrderByLink } from '@/lib/checkoutApi';
import { useLiveOrder } from '@/lib/useLiveOrder';
import { ui, useTrackLang, type TrackLang } from '@/lib/trackingI18n';
import { TrackOrderBody } from '../components/TrackOrderBody';
import { InStoreReceipt } from '../components/InStoreReceipt';

export function LangToggle({ lang, onChange }: { lang: TrackLang; onChange: (lang: TrackLang) => void }) {
  const base = 'px-3 min-h-[32px] text-[12px] font-semibold transition-colors';
  return (
    <div role="group" aria-label="Language" className="inline-flex overflow-hidden rounded-md border border-line-strong">
      <button type="button" onClick={() => onChange('bn')} aria-pressed={lang === 'bn'} className={`${base} ${lang === 'bn' ? 'bg-ink text-white' : 'text-ink'}`}>
        বাংলা
      </button>
      <button type="button" onClick={() => onChange('en')} aria-pressed={lang === 'en'} className={`${base} ${lang === 'en' ? 'bg-ink text-white' : 'text-ink'}`}>
        English
      </button>
    </div>
  );
}

/**
 * The page behind the private tracking link (tracking-plan.md Steps 1 and 4). The server renders the
 * first paint from `initialOrder`, so it shows without JavaScript; the browser then refreshes it
 * once a minute while the order is still moving. One view for every store, whatever its theme.
 * The API already masks the contact details for this route.
 */
export function TrackOrderView({
  subdomain,
  token,
  storeName,
  logoUrl,
  whatsappUrl,
  initialOrder,
}: {
  subdomain: string;
  token: string;
  storeName: string;
  logoUrl: string | null;
  whatsappUrl: string | null;
  initialOrder: TrackedOrder;
}) {
  const [lang, setLang] = useTrackLang();
  const { order, checkedAt, finished, replace } = useLiveOrder(initialOrder, () => fetchTrackedOrderByLink(subdomain, token));

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {order.source === 'POS' ? (
          // A counter sale: the page is its receipt (POS-system-plan.md Step 5).
          <>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-ink mb-4">{ui(lang, 'receipt')}</h1>
            <InStoreReceipt order={order} lang={lang} />
          </>
        ) : (
          <>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-ink mb-4">{ui(lang, 'orderTracking')}</h1>
            <TrackOrderBody
              order={order}
              lang={lang}
              whatsappUrl={whatsappUrl}
              checkedAt={checkedAt}
              live={!finished}
              subdomain={subdomain}
              onOrderChanged={replace}
            />
          </>
        )}
      </main>
    </div>
  );
}
