'use client';

import { ExternalLink, MapPin } from 'lucide-react';
import { useStoreText } from '../lib/storeText';

/**
 * The store's address with a map at the bottom of the footer (2026-10-29, the owner's rule): every store shows one. A
 * store that typed its own address (Store > Footer contact, else the Contact page's "Based in") shows that address with
 * a Google Maps link; a store with none shows the platform default, Uttara, Dhaka 1230, with a map of it.
 *
 * The map is OpenStreetMap's own embed (free, no key, attribution inside the frame). Google's embedded map needs an API
 * key and a billing account, so Google is a plain link (its documented keyless search address). A typed address can't be
 * placed on the map without a geocoding service, so only the default address gets the embedded map.
 */
export const DEFAULT_FOOTER_ADDRESS = 'Uttara, Dhaka 1230';
// Uttara (Dhaka 1230): the pin and a box around it for the embed.
const DEFAULT_PIN = { lat: 23.8759, lng: 90.3795 };
const DEFAULT_MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${DEFAULT_PIN.lng - 0.018}%2C${DEFAULT_PIN.lat - 0.011}%2C${
  DEFAULT_PIN.lng + 0.018
}%2C${DEFAULT_PIN.lat + 0.011}&layer=mapnik&marker=${DEFAULT_PIN.lat}%2C${DEFAULT_PIN.lng}`;

export function FooterLocation({ address }: { address?: string | null }) {
  const t = useStoreText();
  const own = address?.trim();
  const shown = own || DEFAULT_FOOTER_ADDRESS;
  const googleLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shown)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6" data-rg="footer-location">
      <div className="overflow-hidden rounded-xl border border-line bg-surface sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col justify-center gap-3 p-5">
          <p className="m-0 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <MapPin size={18} className="text-accent" aria-hidden />
            {t('Find us')}
          </p>
          <p className="m-0 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">{shown}</p>
          <a
            href={googleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-accent-dark"
          >
            {t('Open in Google Maps')}
            <ExternalLink size={13} aria-hidden />
          </a>
        </div>
        {!own && (
          <iframe
            src={DEFAULT_MAP_SRC}
            title={`${t('Map')}: ${shown}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-56 w-full border-0 border-t border-line sm:h-full sm:min-h-56 sm:border-l sm:border-t-0"
          />
        )}
      </div>
    </div>
  );
}
