/*
 * The smaller copies of an uploaded picture. The server (server/src/upload/image-variants.ts) saves every upload in R2 as one
 * original plus a WebP in each ladder width and a 1200x630 link-preview picture, all named after the original:
 *
 *   .../Regantify/product-x-1.jpg      the original
 *   .../Regantify/product-x-1.w640.webp   a ladder width
 *   .../Regantify/product-x-1.og.jpg      the link preview
 *
 * This file finds those names from an original's address. The ladder and the suffixes are kept in step by hand with the server's file and
 * client/src/lib/imageVariants.ts. Any address that is not one of our uploads comes back as null, and callers then use it as it is.
 */
export const WIDTH_LADDER = [320, 640, 960, 1280, 1920] as const;

// <host>/Regantify/<name>.<ext>, with an optional ?v=… that a replaced picture (store logo, avatar) carries.
const OWN = /^(.*\/Regantify\/[^/?#]+)\.(?:jpe?g|png|webp|gif|avif)(\?[^#]*)?$/i;

/** The smallest ladder width that is at least `wanted` pixels (the widest one for anything bigger). */
export function snapWidth(wanted: number): number {
  return WIDTH_LADDER.find((w) => w >= wanted) ?? WIDTH_LADDER[WIDTH_LADDER.length - 1];
}

/** The WebP copy of an uploaded picture for `wanted` pixels of width, or null when the address is not one of our uploads. */
export function variantUrl(src: string, wanted: number): string | null {
  const m = OWN.exec(src);
  return m ? `${m[1]}.w${snapWidth(wanted)}.webp${m[2] ?? ''}` : null;
}

/** The 1200x630 link-preview copy of an uploaded picture, or null when the address is not one of our uploads. */
export function ogImageUrl(src: string): string | null {
  const m = OWN.exec(src);
  return m ? `${m[1]}.og.jpg${m[2] ?? ''}` : null;
}
