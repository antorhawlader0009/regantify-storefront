/**
 * next/image loader (set as `images.loaderFile` in next.config.ts). Pictures live in Cloudflare R2 with a fixed set of widths saved next to
 * each original (see lib/imageVariants.ts), so the browser downloads the width it needs straight from R2's CDN and neither this server nor
 * the API resizes anything while a page loads. The requested width is rounded up to the nearest saved one.
 *
 * A store's watermarked photo is a link to the API's `/v1/image/wm` route (server/src/storefront/watermark.ts), which takes the width as `w`.
 * Any other address (a picture pasted from elsewhere; data: images are never passed here) is returned as it is.
 */
import { snapWidth, variantUrl } from './imageVariants';

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (src.includes('/v1/image/wm?')) return `${src}&w=${snapWidth(width)}`;
  return variantUrl(src, width) ?? src;
}
