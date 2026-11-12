import { Fraunces, Hanken_Grotesk, Hind_Siliguri, Archivo, Newsreader, Poppins, DM_Sans, Pacifico, Inter, Playfair_Display, Oswald, Barlow_Condensed, Cormorant_Garamond } from 'next/font/google';

// Five font families, self-hosted at build time (next/font) - no
// runtime request to Google Fonts from a visitor's browser, no layout
// shift while a webfont loads in. Two independent pairings, one per
// theme (see StoreTheme) - loaded together here since next/font
// requires static imports, but each theme's globals.css only ever
// references its own pair's CSS variables, so a visitor's browser only
// downloads the two font files the active theme actually uses.
//
// Medium theme:
// Fraunces - display serif for store names and section headings. A
// variable optical-size axis means it can flex from a quiet subhead to
// a dramatic hero without switching typefaces.
// Hanken Grotesk - UI workhorse: body copy, prices, buttons, forms.
//
// Minimal theme (deliberately unrelated to the pair above, so the two
// themes never feel like reskins of each other):
// Newsreader - a quieter editorial serif for headings; lower contrast
// and less decorative than Fraunces, matching Minimal's restrained tone.
// Archivo - a grotesque sans for body/UI text with a plainer, more
// neutral rhythm than Hanken Grotesk's.
//
// Hind Siliguri - the default for Bangla letters (none of the above has them), shared by every theme. It replaced
// Noto Sans Bengali on 2026-10-29 (the owner found Noto hard to read); a store can pick another in Store > Branding
// (lib/storeFonts.ts, --font-bangla-store).
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

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
});

// StorePal theme (see reference screenshots at storepal.com.bd): a
// single plain grotesque sans for everything, including the "StorePal"
// wordmark itself (bold weight, no separate display face) - unlike
// Medium/Minimal's serif+sans pairings, matching how the reference site
// sets its whole UI in one workhorse font.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Mahabesh skin (2026-11-12): Archivo with the heavy 800 weight its headings use. A separate instance (not the shared
// `archivo` above, which Medium uses at up to 700) so only a Mahabesh store downloads the extra weight.
const archivoMahabesh = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo-mh',
  display: 'swap',
  preload: false,
});

// PlayMate skin (StorePal pages with a toy-store look, 2026-11-03): DM Sans for everything, Pacifico for the script
// wordmark only. A browser downloads them only on a PlayMate store, where globals.css uses them.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
});

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
  display: 'swap',
  preload: false,
});

// Solevo skin (2026-11-04): Inter for everything, Playfair Display for headings and the wordmark. Only a Solevo store's
// CSS uses them, so other stores' browsers do not download them (preload false).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

// Stride skin (2026-11-12): Oswald for its heavy condensed capitals (DM Sans, already here, is its body face).
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
  preload: false,
});

// Vaelora skin (2026-11-12): Barlow Condensed for the hero capitals, Cormorant Garamond for the serif headings and wordmark.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-cond',
  display: 'swap',
  preload: false,
});
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
});

// Combined so a single className on <html> covers every script - see
// app/globals.css's --font-sans / --font-display (Medium's default
// values) and its [data-theme="minimal"]/[data-theme="storepal"] blocks
// (each theme's own override values), both of which reference these
// same CSS variables.
export const fontVariables = `${fraunces.variable} ${hankenGrotesk.variable} ${newsreader.variable} ${archivo.variable} ${archivoMahabesh.variable} ${poppins.variable} ${dmSans.variable} ${pacifico.variable} ${inter.variable} ${playfair.variable} ${oswald.variable} ${barlowCondensed.variable} ${cormorant.variable} ${hindSiliguri.variable}`;
