import { Fraunces, Hanken_Grotesk, Noto_Sans_Bengali, Archivo, Newsreader, Poppins } from 'next/font/google';

// Five font families, self-hosted at build time (next/font) — no
// runtime request to Google Fonts from a visitor's browser, no layout
// shift while a webfont loads in. Two independent pairings, one per
// theme (see StoreTheme) — loaded together here since next/font
// requires static imports, but each theme's globals.css only ever
// references its own pair's CSS variables, so a visitor's browser only
// downloads the two font files the active theme actually uses.
//
// Medium theme:
// Fraunces — display serif for store names and section headings. A
// variable optical-size axis means it can flex from a quiet subhead to
// a dramatic hero without switching typefaces.
// Hanken Grotesk — UI workhorse: body copy, prices, buttons, forms.
//
// Minimal theme (deliberately unrelated to the pair above, so the two
// themes never feel like reskins of each other):
// Newsreader — a quieter editorial serif for headings; lower contrast
// and less decorative than Fraunces, matching Minimal's restrained tone.
// Archivo — a grotesque sans for body/UI text with a plainer, more
// neutral rhythm than Hanken Grotesk's.
//
// Noto Sans Bengali — fallback for Bangla glyphs none of the above
// cover (product names, descriptions, or UI text in Bangla), shared by
// both themes.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

// StorePal theme (see reference screenshots at storepal.com.bd): a
// single plain grotesque sans for everything, including the "StorePal"
// wordmark itself (bold weight, no separate display face) — unlike
// Medium/Minimal's serif+sans pairings, matching how the reference site
// sets its whole UI in one workhorse font.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Combined so a single className on <html> covers every script — see
// app/globals.css's --font-sans / --font-display (Medium's default
// values) and its [data-theme="minimal"]/[data-theme="storepal"] blocks
// (each theme's own override values), both of which reference these
// same CSS variables.
export const fontVariables = `${fraunces.variable} ${hankenGrotesk.variable} ${newsreader.variable} ${archivo.variable} ${poppins.variable} ${notoSansBengali.variable}`;
