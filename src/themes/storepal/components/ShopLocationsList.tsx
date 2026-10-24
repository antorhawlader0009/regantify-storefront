'use client';

import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import type { StoreShopLocation } from '@/lib/storefrontApi';
import { useStoreText } from '../lib/storeText';

/**
 * The store's shops as cards (server shop-locations/). The whole card opens the shop on Google Maps; "Directions" starts the route there
 * (Google's documented Maps URLs, which also open the Maps app on a phone), and "Call" dials the shop.
 */
export function ShopLocationsList({ items }: { items: StoreShopLocation[] }) {
  const t = useStoreText();
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((l) => (
        <li key={l.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
          <a href={l.openUrl} target="_blank" rel="noopener noreferrer" className="group flex-1">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink group-hover:text-accent">
              <MapPin size={17} className="shrink-0 text-accent" aria-hidden />
              {l.name}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{l.address}</p>
            {l.hours && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
                <Clock size={13} aria-hidden />
                {l.hours}
              </p>
            )}
            <span className="mt-2 inline-block text-[12.5px] font-medium text-accent group-hover:underline">{t('Open in Google Maps')}</span>
          </a>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={l.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
            >
              <Navigation size={14} aria-hidden />
              {t('Directions')}
            </a>
            {l.phone && (
              <a href={`tel:${l.phone.replace(/[\s-]/g, '')}`} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-canvas">
                <Phone size={14} aria-hidden />
                {t('Call')}
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The page heading, in the store's language. */
export function ShopLocationsHeading() {
  const t = useStoreText();
  return (
    <>
      <h1 className="mb-1 text-center text-[28px] font-bold">{t('Our shops')}</h1>
      <p className="mb-8 text-center text-[13px] text-muted">{t('Visit us at our shops')}</p>
    </>
  );
}
