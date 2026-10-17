import type { ReactNode } from 'react';

/**
 * Drawn sample pictures for a store that has nothing to show yet (see store-empty-preview.md in the workspace root).
 * The same idea as Shopify's `placeholder_svg_tag`: inline SVGs picked by name, so nothing is downloaded. The drawings
 * are our own. Theme-independent on purpose: every template uses these and only decides where they go; a template
 * that wants its own colours passes a `palette` (shades are made with white/black overlays, so any colours work).
 */

export interface PlaceholderPalette {
  /** The tile behind a product drawing. */
  bg: string;
  /** The hero's sky. */
  sky: string;
  primary: string;
  secondary: string;
  neutral: string;
  accent: string;
  dark: string;
  light: string;
}

export const DEFAULT_PLACEHOLDER_PALETTE: PlaceholderPalette = {
  bg: '#F2F2F2',
  sky: '#EFE3D3',
  primary: '#E2685A',
  secondary: '#24897F',
  neutral: '#717679',
  accent: '#E8B04B',
  dark: '#3A3F44',
  light: '#FFFFFF',
};

export type ProductArtName =
  | 'product-1'
  | 'product-2'
  | 'product-3'
  | 'product-4'
  | 'product-5'
  | 'product-6'
  | 'product-7'
  | 'product-8';

export type PlaceholderName = ProductArtName | 'hero-1';

const HI = { fill: '#fff', fillOpacity: 0.22 } as const;
const SHADE = { fill: '#000', fillOpacity: 0.12 } as const;

/** A soft floor shadow under a product. */
function Floor({ y = 330, rx = 110 }: { y?: number; rx?: number }) {
  return <ellipse cx="200" cy={y} rx={rx} ry="10" fill="#000" fillOpacity="0.06" />;
}

/** T-shirt. */
function TShirt(p: PlaceholderPalette) {
  return (
    <>
      <Floor y={322} rx={100} />
      <path
        d="M150 110 L108 128 L70 178 L108 206 L130 186 L130 300 Q130 310 140 310 L260 310 Q270 310 270 300 L270 186 L292 206 L330 178 L292 128 L250 110 Q200 146 150 110 Z"
        fill={p.primary}
      />
      <path d="M200 132 L250 110 L292 128 L330 178 L292 206 L270 186 L270 300 Q270 310 260 310 L200 310 Z" {...SHADE} fillOpacity={0.07} />
      <path d="M150 110 Q200 146 250 110" fill="none" stroke={p.accent} strokeWidth="10" strokeLinecap="round" />
      <path d="M72 180 L106 204 M328 180 L294 204" stroke={p.accent} strokeWidth="9" strokeLinecap="round" />
      <rect x="193" y="124" width="14" height="8" rx="2" fill={p.light} />
      <path d="M130 268 H270 V284 H130 Z M130 292 H270 V300 Q270 310 260 310 H140 Q130 310 130 300 Z" {...SHADE} />
    </>
  );
}

/** Mug with steam. */
function Mug(p: PlaceholderPalette) {
  return (
    <>
      <ellipse cx="196" cy="296" rx="96" ry="13" fill={p.neutral} fillOpacity="0.3" />
      <path d="M248 180 H264 Q294 180 294 212 Q294 244 264 244 H248" fill="none" stroke={p.secondary} strokeWidth="16" />
      <rect x="132" y="140" width="120" height="152" rx="16" fill={p.secondary} />
      <rect x="132" y="204" width="120" height="22" fill={p.accent} />
      <rect x="146" y="154" width="11" height="110" rx="5.5" {...HI} />
      <ellipse cx="192" cy="141" rx="58" ry="9" {...SHADE} fillOpacity={0.18} />
      <g fill="none" stroke={p.neutral} strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round">
        <path d="M168 120 q-10 -14 0 -28 q10 -14 0 -28" />
        <path d="M192 116 q-10 -14 0 -28 q10 -14 0 -28" />
        <path d="M216 120 q-10 -14 0 -28 q10 -14 0 -28" />
      </g>
    </>
  );
}

/** Sneaker. */
function Sneaker(p: PlaceholderPalette) {
  return (
    <>
      <Floor y={306} rx={150} />
      <g transform="translate(200 236) scale(1.22) translate(-206 -236)">
      <path d="M92 262 L97 205 Q101 186 124 186 L164 189 Q190 220 232 228 L300 238 Q332 245 332 262 Z" fill={p.primary} />
      <path d="M266 235 Q320 240 332 262 L272 262 Z" {...HI} />
      <rect x="88" y="198" width="18" height="44" rx="7" fill={p.accent} />
      <path d="M140 246 Q200 232 268 250" fill="none" stroke={p.light} strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
      <g stroke={p.light} strokeWidth="5" strokeLinecap="round">
        <path d="M150 196 L166 210" />
        <path d="M164 206 L180 219" />
        <path d="M178 215 L194 226" />
      </g>
      <rect x="80" y="260" width="256" height="26" rx="13" fill={p.light} />
      <rect x="80" y="276" width="256" height="10" rx="5" fill={p.dark} fillOpacity="0.85" />
      </g>
    </>
  );
}

/** Handbag. */
function Handbag(p: PlaceholderPalette) {
  return (
    <>
      <Floor y={322} rx={115} />
      <path d="M155 172 V142 Q155 104 200 104 Q245 104 245 142 V172" fill="none" stroke={p.dark} strokeWidth="12" strokeLinecap="round" />
      <path d="M110 165 H290 L306 300 Q307 312 295 312 H105 Q93 312 94 300 Z" fill={p.neutral} />
      <path d="M110 165 H290 L294 214 Q200 246 106 214 Z" {...SHADE} />
      <rect x="187" y="214" width="26" height="20" rx="4" fill={p.accent} />
      <rect x="118" y="180" width="10" height="110" rx="5" {...HI} fillOpacity={0.15} />
    </>
  );
}

/** Wrist watch. */
function Watch(p: PlaceholderPalette) {
  const ticks = [0, 90, 180, 270];
  return (
    <>
      <Floor y={338} rx={70} />
      <rect x="170" y="78" width="60" height="96" rx="12" fill={p.secondary} />
      <rect x="170" y="226" width="60" height="98" rx="12" fill={p.secondary} />
      <rect x="170" y="78" width="16" height="96" rx="8" {...HI} />
      {[262, 280, 298].map((y) => (
        <circle key={y} cx="200" cy={y} r="4" fill={p.dark} fillOpacity="0.35" />
      ))}
      <rect x="258" y="190" width="14" height="20" rx="3" fill={p.dark} />
      <circle cx="200" cy="200" r="64" fill={p.dark} />
      <circle cx="200" cy="200" r="51" fill={p.light} />
      {ticks.map((deg) => (
        <rect key={deg} x="197" y="154" width="6" height="12" rx="2" fill={p.dark} transform={`rotate(${deg} 200 200)`} />
      ))}
      <path d="M200 200 V164" stroke={p.dark} strokeWidth="6" strokeLinecap="round" />
      <path d="M200 200 L228 214" stroke={p.primary} strokeWidth="5" strokeLinecap="round" />
      <circle cx="200" cy="200" r="6" fill={p.dark} />
    </>
  );
}

/** Headphones. */
function Headphones(p: PlaceholderPalette) {
  return (
    <>
      <Floor y={322} rx={110} />
      <path d="M122 236 V200 Q122 108 200 108 Q278 108 278 200 V236" fill="none" stroke={p.dark} strokeWidth="16" strokeLinecap="round" />
      <path d="M140 132 Q200 92 260 132" fill="none" stroke={p.light} strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <rect x="94" y="208" width="56" height="94" rx="24" fill={p.primary} />
      <rect x="250" y="208" width="56" height="94" rx="24" fill={p.primary} />
      <rect x="138" y="220" width="20" height="70" rx="9" fill={p.dark} />
      <rect x="242" y="220" width="20" height="70" rx="9" fill={p.dark} />
      <rect x="104" y="220" width="10" height="66" rx="5" {...HI} />
      <rect x="286" y="220" width="10" height="66" rx="5" {...SHADE} />
    </>
  );
}

/** Potted plant. */
function Plant(p: PlaceholderPalette) {
  const leaves: Array<[number, number, number, number, number]> = [
    // cx, cy, rx, ry, rotate
    [200, 140, 19, 62, 0],
    [164, 166, 16, 52, -34],
    [236, 166, 16, 52, 34],
    [148, 204, 13, 36, -62],
    [252, 204, 13, 36, 62],
  ];
  return (
    <>
      <Floor y={330} rx={80} />
      {leaves.map(([cx, cy, rx, ry, r]) => (
        <g key={`${cx}-${cy}`} transform={`rotate(${r} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={p.secondary} />
          <path d={`M${cx} ${cy - ry + 10} V${cy + ry - 6}`} stroke="#fff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <path d="M146 236 H254 L240 314 Q238 322 230 322 H170 Q162 322 160 314 Z" fill={p.primary} />
      <rect x="138" y="222" width="124" height="22" rx="6" fill={p.primary} />
      <rect x="138" y="236" width="124" height="8" {...SHADE} />
      <path d="M156 250 L168 312" stroke="#fff" strokeOpacity="0.22" strokeWidth="8" strokeLinecap="round" />
    </>
  );
}

/** Pump bottle and a small jar. */
function Cosmetics(p: PlaceholderPalette) {
  return (
    <>
      <Floor y={322} rx={120} />
      <rect x="150" y="96" width="42" height="28" rx="6" fill={p.dark} />
      <rect x="186" y="102" width="34" height="9" rx="4.5" fill={p.dark} />
      <rect x="158" y="122" width="26" height="26" fill={p.accent} />
      <rect x="158" y="122" width="26" height="26" {...SHADE} />
      <rect x="128" y="144" width="86" height="168" rx="18" fill={p.accent} />
      <rect x="138" y="196" width="66" height="70" rx="6" fill={p.light} />
      <path d="M150 216 H192 M150 230 H182 M150 244 H188" stroke={p.neutral} strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" />
      <rect x="140" y="156" width="10" height="34" rx="5" {...HI} />
      <rect x="230" y="252" width="80" height="60" rx="12" fill={p.secondary} />
      <rect x="226" y="236" width="88" height="22" rx="7" fill={p.dark} />
      <rect x="240" y="266" width="8" height="34" rx="4" {...HI} />
    </>
  );
}

const PRODUCTS: Record<ProductArtName, (p: PlaceholderPalette) => ReactNode> = {
  'product-1': TShirt,
  'product-2': Mug,
  'product-3': Sneaker,
  'product-4': Handbag,
  'product-5': Watch,
  'product-6': Headphones,
  'product-7': Plant,
  'product-8': Cosmetics,
};

/** A wide landscape: sun, hills, a tree line and a lake. Drawn for 1200 x 520 and cropped to any box. */
function HeroScene(p: PlaceholderPalette) {
  const farTrees = [70, 120, 170, 360, 410, 460, 1060, 1110];
  const nearTrees = [40, 95, 150, 205, 900, 955, 1010, 1065, 1120, 1175];
  return (
    <>
      <rect width="1200" height="520" fill={p.sky} />
      <circle cx="860" cy="168" r="74" fill={p.primary} fillOpacity="0.9" />
      <g fill="#fff" fillOpacity="0.75">
        <rect x="150" y="92" width="190" height="26" rx="13" />
        <rect x="210" y="74" width="96" height="30" rx="15" />
        <rect x="930" y="70" width="170" height="22" rx="11" />
      </g>
      <path d="M400 150 l14 -8 l14 8 M438 134 l10 -6 l10 6" fill="none" stroke={p.dark} strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
      {/* Trees first, then the hill in front of them, so only their tops show and they sit on the hill. */}
      {farTrees.map((x) => (
        <path key={`f${x}`} d={`M${x} 300 L${x + 24} 196 L${x + 48} 300 Z`} fill={p.secondary} />
      ))}
      <path d="M0 300 Q150 196 300 256 T600 236 T900 250 T1200 214 V520 H0 Z" fill={p.neutral} />
      <path d="M0 300 Q150 196 300 256 T600 236 T900 250 T1200 214 V520 H0 Z" fill="#fff" fillOpacity="0.42" />
      {nearTrees.map((x) => (
        <path key={`n${x}`} d={`M${x} 372 L${x + 28} 204 L${x + 56} 372 Z`} fill={p.secondary} />
      ))}
      <path d="M0 344 Q200 262 420 322 T800 302 T1200 312 V520 H0 Z" fill={p.neutral} />
      <rect y="372" width="1200" height="148" fill={p.secondary} fillOpacity="0.85" />
      <g stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round">
        <path d="M120 412 H300" />
        <path d="M460 440 H700" />
        <path d="M820 418 H1010" />
        <path d="M260 476 H420" />
        <path d="M900 484 H1100" />
      </g>
      <path d="M0 470 Q120 440 260 470 T520 520 H0 Z" fill={p.dark} fillOpacity="0.55" />
      <path d="M760 520 Q900 456 1060 470 T1200 452 V520 Z" fill={p.dark} fillOpacity="0.45" />
    </>
  );
}

export interface PlaceholderArtProps {
  name: PlaceholderName;
  palette?: Partial<PlaceholderPalette>;
  className?: string;
}

/** One sample picture. Always decorative (`aria-hidden`): the surrounding markup says what it is. */
export function PlaceholderArt({ name, palette, className }: PlaceholderArtProps) {
  const p = { ...DEFAULT_PLACEHOLDER_PALETTE, ...palette };
  if (name === 'hero-1') {
    return (
      <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden focusable="false">
        {HeroScene(p)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden focusable="false">
      <rect width="400" height="400" fill={p.bg} />
      {PRODUCTS[name](p)}
    </svg>
  );
}
