/*
 * Link previews for every chat and social app (WhatsApp, Messenger, Instagram, Telegram, TikTok, Facebook, X, Google...).
 * They all read the same Open Graph tags, so one set of tags is built here and every public page uses it:
 *   - title, description, url, site name and a picture, with the picture's real size;
 *   - the picture is a 1200x630 JPEG kept small. WhatsApp is the strictest app: it may drop a picture over about 300 KB, and the
 *     seller's upload can be a 4 MB photo of any shape, so every upload gets its own 1200x630 copy made by the server when it is
 *     uploaded (server/src/upload/image-variants.ts; the original is never changed). Pictures that are not our uploads are passed
 *     through as they are.
 *   - a page with no picture of its own falls back to the store's cover photo, then its logo, so a link never goes out bare.
 */
import type { Metadata } from 'next';
import { ogImageUrl } from './imageVariants';

export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;

/**
 * The link-preview copy of one of our uploads (1200x630 JPEG). Whether it fills the frame (a cover) or sits whole on its own colour
 * (a product photo, a logo) was decided when the picture was uploaded, from what it is for, so the mode argument is only kept for the callers.
 */
export function shareImageUrl(url: string, _mode: 'cover' | 'fit' = 'cover'): string {
  return ogImageUrl(url) ?? url;
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
  // A picture we could not resize (not one of our uploads) has an unknown size, so none is claimed.
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
