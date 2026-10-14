/*
 * Link previews for every chat and social app (WhatsApp, Messenger, Instagram, Telegram, TikTok, Facebook, X, Google...).
 * They all read the same Open Graph tags, so one set of tags is built here and every public page uses it:
 *   - title, description, url, site name and a picture, with the picture's real size;
 *   - the picture is a 1200x630 JPEG kept small. WhatsApp is the strictest app: it may drop a picture over about 300 KB, and the
 *     seller's upload can be a 4 MB photo of any shape, so Cloudinary pictures are resized and compressed in the address itself
 *     (the upload is never changed). Pictures that are not on Cloudinary are passed through as they are.
 *   - a page with no picture of its own falls back to the store's cover photo, then its logo, so a link never goes out bare.
 */
import type { Metadata } from 'next';

export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;

const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * 'cover': fills the 1200x630 frame, cropping towards the interesting part (a picture made for sharing).
 * 'fit': keeps the whole picture and fills the sides with the picture's main colour (a product photo, a logo), so nothing is cut off.
 */
export function shareImageUrl(url: string, mode: 'cover' | 'fit' = 'cover'): string {
  const m = CLOUDINARY.exec(url);
  if (!m) return url;
  const frame = mode === 'cover' ? `c_fill,g_auto,w_${SHARE_WIDTH},h_${SHARE_HEIGHT}` : `c_pad,b_auto:predominant,w_${SHARE_WIDTH},h_${SHARE_HEIGHT}`;
  return `${m[1]}${frame},f_jpg,q_auto:eco/${m[2]}`;
}

interface StoreForShare {
  storeName: string;
  brandCoverImageUrl?: string | null;
  logoUrl?: string | null;
}

/** The pictures to offer, best first: this page's own picture, else the store's cover photo, else its logo. */
export function shareImages(store: StoreForShare, own?: { url?: string | null; mode?: 'cover' | 'fit' } | null, alt?: string) {
  const choice: { url: string; mode: 'cover' | 'fit' } | null = own?.url
    ? { url: own.url, mode: own.mode ?? 'cover' }
    : store.brandCoverImageUrl
      ? { url: store.brandCoverImageUrl, mode: 'cover' }
      : store.logoUrl
        ? { url: store.logoUrl, mode: 'fit' }
        : null;
  if (!choice) return undefined;
  const converted = shareImageUrl(choice.url, choice.mode);
  // A picture we could not resize (not on Cloudinary) has an unknown size, so none is claimed.
  const sized = converted !== choice.url;
  return [{ url: converted, ...(sized ? { width: SHARE_WIDTH, height: SHARE_HEIGHT } : {}), alt: alt || store.storeName }];
}

interface SocialInput {
  store: StoreForShare;
  title: string;
  description?: string | null;
  url: string;
  type?: 'website' | 'article';
  /** The page's own picture (a product photo, a blog cover...). */
  image?: string | null;
  imageMode?: 'cover' | 'fit';
  locale?: 'en' | 'bn';
}

/** The `openGraph` and `twitter` parts of a page's metadata. Spread it into the object generateMetadata returns. */
export function socialMeta(input: SocialInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const description = input.description?.trim() || undefined;
  const images = shareImages(input.store, { url: input.image, mode: input.imageMode }, input.title);
  return {
    openGraph: {
      title: input.title,
      description,
      url: input.url,
      siteName: input.store.storeName,
      type: input.type ?? 'website',
      locale: input.locale === 'bn' ? 'bn_BD' : 'en_US',
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: input.title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
