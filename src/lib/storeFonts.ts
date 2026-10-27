import type { CSSProperties } from 'react';

/*
 * The store's own fonts (Store > Branding > Fonts: Vendor.brandHeadingFont / brandBodyFont), shared by every template.
 * Google Fonts' css2 address refuses the whole request when a family is asked for a weight it doesn't have, so a font
 * from the dashboard's list is asked for the weights it really has (kept in step with client lib/storeFonts.ts), and a
 * name typed by hand is asked for its regular weight only. Unknown names simply fall back to the theme font.
 */

/** Weights each listed font has on Google Fonts. */
const FONT_WEIGHTS: Record<string, string> = {
  'Hind Siliguri': '400;500;600;700',
  'Noto Sans Bengali': '400;500;600;700',
  'Noto Serif Bengali': '400;500;600;700',
  'Baloo Da 2': '400;500;600;700',
  'Anek Bangla': '400;500;600;700',
  'Tiro Bangla': '400',
  Galada: '400',
  Atma: '400;500;600;700',
  Mina: '400;700',
  Poppins: '400;500;600;700',
  Inter: '400;500;600;700',
  Roboto: '400;500;700',
  'Open Sans': '400;500;600;700',
  Lato: '400;700',
  Montserrat: '400;500;600;700',
  Nunito: '400;500;600;700',
  'DM Sans': '400;500;600;700',
  Raleway: '400;500;600;700',
  'Work Sans': '400;500;600;700',
  Rubik: '400;500;600;700',
  'Playfair Display': '400;500;600;700',
  Lora: '400;500;600;700',
  Merriweather: '400;700',
  Oswald: '400;500;600;700',
  'Bebas Neue': '400',
};

/** A font name safe to put in CSS and an address (letters, digits, spaces); null otherwise. */
export function safeFontName(name: string | null | undefined): string | null {
  const n = (name ?? '').replace(/\s+/g, ' ').trim();
  return n && /^[A-Za-z0-9 ]{1,60}$/.test(n) ? n : null;
}

/** The Google Fonts stylesheet address for the store's fonts, or null when none is set. */
export function storeFontsHref(names: (string | null | undefined)[]): string | null {
  const unique = Array.from(new Set(names.map(safeFontName).filter((n): n is string => !!n)));
  if (unique.length === 0) return null;
  const families = unique.map((n) => {
    const family = `family=${encodeURIComponent(n).replace(/%20/g, '+')}`;
    const weights = FONT_WEIGHTS[n];
    return weights ? `${family}:wght@${weights}` : family;
  });
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * The CSS for the store's wrapper: its own font first, then Noto Sans Bengali (so Bangla text always has letters, whatever
 * the chosen font covers), then the system font. Never refers to the variable it sets (that would make it invalid).
 */
export function storeFontStyle(heading: string | null | undefined, body: string | null | undefined): CSSProperties {
  const h = safeFontName(heading);
  const b = safeFontName(body);
  const style: Record<string, string> = {};
  if (h) style['--font-display'] = `"${h}", var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif`;
  if (b) {
    style['--font-sans'] = `"${b}", var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif`;
    // The page inherits the font already worked out on <html>; the wrapper has to set it again to use its own variable.
    style.fontFamily = 'var(--font-sans)';
  }
  return style as CSSProperties;
}
