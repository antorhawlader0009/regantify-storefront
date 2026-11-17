/**
 * Store > Hero Section (2026-11-17): the home page hero shows only the pictures the store picked there, in its order, as many as its plan
 * allows (the server already cut the list; rules in server/src/hero-slides/hero-slides.ts). Category covers are no longer used in the hero.
 * Shared by every template: each one only draws these slides its own way.
 */
export interface StoreHeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  text: string;
  buttonText: string;
  /** "" = not a link; "/..." = a page of this store; else a full address. */
  link: string;
}

/** The address a slide opens, written in the store's long form like every other store link, or null when it is not a link. */
export function heroSlideHref(link: string | null | undefined, subdomain: string): string | null {
  const l = (link ?? '').trim();
  if (!l) return null;
  if (l.startsWith('/') && !l.startsWith('//')) {
    if (l === '/') return `/store/${subdomain}`;
    if (l.startsWith('/?') || l.startsWith('/#')) return `/store/${subdomain}${l.slice(1)}`;
    return `/store/${subdomain}${l}`;
  }
  return /^https?:\/\//i.test(l) ? l : null;
}

/** True when the address leaves the store (opened in a new tab). */
export function isOutsideLink(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function cleanHeroSlides(value: unknown): StoreHeroSlide[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s): s is StoreHeroSlide => Boolean(s && typeof s === 'object' && typeof (s as StoreHeroSlide).imageUrl === 'string' && (s as StoreHeroSlide).imageUrl));
}
