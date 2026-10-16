/**
 * next/image loader (PERFORMANCE-PLAN.md Step 10, set as `images.loaderFile` in next.config.ts). Cloudinary resizes the
 * photo and picks the format itself (`c_limit,w_<width>,f_auto,q_auto`), so the browser downloads it straight from
 * Cloudinary's CDN and the VPS no longer resizes every photo with its own CPU and memory.
 *
 * Any transformation already in the address (the store's watermark, server/src/storefront/watermark.ts) is kept and
 * the resize is added AFTER it, so the mark is drawn on the full photo and scaled down with it, exactly as the old
 * optimizer showed it. `c_limit` never makes a photo bigger than it was uploaded. Any other address (only Cloudinary is
 * allowed for remote photos; data: images are never passed here) is returned as it is.
 */
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// One transformation step: comma-separated parts like `w_400`, `l_text:Arial_40_bold:Shop`, `fl_layer_apply`.
const TRANSFORMATION = /^[a-z]{1,3}_[^/]*$/i;

export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const m = CLOUDINARY.exec(src);
  if (!m) return src;
  const segments = m[2].split('/');
  let i = 0;
  while (i < segments.length - 1 && segments[i].split(',').every((part) => TRANSFORMATION.test(part))) i++;
  const resize = `c_limit,w_${width},f_auto,q_${quality ?? 'auto'}`;
  return `${m[1]}${[...segments.slice(0, i), resize, ...segments.slice(i)].join('/')}`;
}
