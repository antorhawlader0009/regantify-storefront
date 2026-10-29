'use client';

import { ExternalLink, MapPin } from 'lucide-react';
import { useStoreText } from '../lib/storeText';

/**
 * The store's address with a small map, as one footer column (2026-10-29, the owner's rule: every store shows one; made compact the
 * same day). A store that typed its own address (Store > Footer contact, else the Contact page's "Based in") shows that address with a
 * Google Maps link; a store with none shows the platform default, Uttara, Dhaka 1230, with a small map of it.
 *
 * The map is OpenStreetMap's own embed (free, no key, attribution inside the frame). Google's embedded map needs an API key and a
 * billing account, so Google is a link: the whole map is one tap target to Google Maps (the frame itself takes no pointer input, so a
 * scroll over the footer never gets caught by the map). A typed address can't be placed on a map without a geocoding service, so only
 * the default address gets the map picture.
 */
export const DEFAULT_FOOTER_ADDRESS = 'Uttara, Dhaka 1230';
// Uttara (Dhaka 1230): the pin and a tight box around it, so the small map shows the neighbourhood.
const DEFAULT_PIN = { lat: 23.8759, lng: 90.3795 };
const DEFAULT_MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${DEFAULT_PIN.lng - 0.012}%2C${DEFAULT_PIN.lat - 0.006}%2C${
  DEFAULT_PIN.lng + 0.012
}%2C${DEFAULT_PIN.lat + 0.006}&layer=mapnik&marker=${DEFAULT_PIN.lat}%2C${DEFAULT_PIN.lng}`;

export function FooterLocation({ address, upper }: { address?: string | null; upper?: boolean }) {
  const t = useStoreText();
  const own = address?.trim();
  const shown = own || DEFAULT_FOOTER_ADDRESS;
  const googleLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shown)}`;

  return (
    <div data-rg="footer-location">
      <p className={`mb-3 text-[15px] font-semibold text-ink ${upper ? 'uppercase' : ''}`}>{t('Find us')}</p>
      <p className="m-0 mb-3 flex items-start gap-1.5 text-[13px] leading-snug text-muted">
        <MapPin size={15} className="mt-px shrink-0" aria-hidden />
        <span className="whitespace-pre-line">{shown}</span>
      </p>
      {!own ? (
        <a
          href={googleLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('Open in Google Maps')}: ${shown}`}
          className="group relative block h-28 w-full max-w-xs overflow-hidden rounded-lg border border-line shadow-[0_2px_6px_-1px_rgba(0,0,0,0.45)] transition-shadow duration-200 hover:shadow-[0_3px_8px_-1px_rgba(0,0,0,0.55)]"
        >
          <iframe
            src={DEFAULT_MAP_SRC}
            title={`${t('Map')}: ${shown}`}
            loading="lazy"
            tabIndex={-1}
            aria-hidden
            referrerPolicy="no-referrer-when-downgrade"
            className="pointer-events-none block h-full w-full border-0 grayscale-[35%] transition-[filter] duration-200 group-hover:grayscale-0"
          />
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#1a2b3c] shadow-sm">
            {t('Open in Google Maps')}
            <ExternalLink size={11} aria-hidden />
          </span>
        </a>
      ) : (
        <a
          href={googleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-accent-dark"
        >
          {t('Open in Google Maps')}
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </div>
  );
}
