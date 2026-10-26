/*
 * Shopper review photos (TellMe idea 2), shared by every template. Only a shopper signed in to their account whose own order of the product is
 * Completed may add them, at most 2 (the server decides; see ReviewsService.submitFromStorefront). Each photo is shrunk here in the browser
 * before it is sent, so a 3-5 MB phone photo goes up as roughly 150-300 KB: less mobile data for the shopper and a quicker upload. The server
 * shrinks it once more (1080 px) before saving.
 */

/** Photos one review may carry; the server holds the same limit. */
export const MAX_REVIEW_PHOTOS = 2;

const SIDE = 1280;
const QUALITY = 0.8;
/** Bigger files are refused before they are opened. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** A JPEG of at most 1280 px on the long side; null when the file is not a picture the browser can open. */
export async function shrinkReviewPhoto(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/') || file.size > MAX_FILE_BYTES) return null;
  let bitmap: ImageBitmap;
  try {
    // from-image: a phone photo taken sideways is turned upright before it is drawn.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
  const scale = Math.min(1, SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  // A transparent PNG would turn black as JPEG: white behind it.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', QUALITY));
}
