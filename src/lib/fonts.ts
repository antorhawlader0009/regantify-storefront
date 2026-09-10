import { Fraunces, Hanken_Grotesk, Noto_Sans_Bengali } from 'next/font/google';

// Three font families, self-hosted at build time (next/font) — no
// runtime request to Google Fonts from a visitor's browser, no layout
// shift while a webfont loads in.
//
// Fraunces — display serif for store names and section headings. A
// variable optical-size axis means it can flex from a quiet subhead to
// a dramatic hero without switching typefaces.
// Hanken Grotesk — UI workhorse: body copy, prices, buttons, forms.
// Noto Sans Bengali — fallback for Bangla glyphs neither of the above
// cover (product names, descriptions, or UI text in Bangla).
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

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

// Combined so a single className on <html> covers every script — see
// globals.css's --font-sans / --font-display, which reference these.
export const fontVariables = `${fraunces.variable} ${hankenGrotesk.variable} ${notoSansBengali.variable}`;
