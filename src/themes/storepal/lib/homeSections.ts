/**
 * The StorePal home page's sections, for Store > Design > Customize. The ids
 * and order are mirrored by hand in the server's HOME_SECTION_IDS and the
 * dashboard's client/src/lib/homeSections.ts.
 */
export type HomeSectionId =
  | 'HERO'
  | 'FLASH_SALE'
  | 'CAMPAIGNS'
  | 'TOP_SELLING'
  | 'CATEGORY_SHORTCUTS'
  | 'CATEGORY_SECTIONS'
  | 'HIGHLIGHTS'
  | 'REVIEWS'
  | 'MAGAZINE'
  | 'FAQ'
  | 'SOCIAL_FEED';

export interface HomeSectionSetting {
  id: string;
  enabled: boolean;
}

// StorePal's own order, which is also what a store that never opened
// Customize (an empty list) gets: every section, in this order.
const DEFAULT_ORDER: HomeSectionId[] = [
  'HERO',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SHORTCUTS',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

/**
 * The sections to show, in order: the vendor's saved list (turned-off ones
 * dropped, unknown or repeated ids ignored), then any section they haven't
 * placed yet (one added to StorePal after they saved), which is shown.
 */
// PlayMate's own order, as the template's home page: hero, perks, categories, best sellers, promo banners, then the rest.
export const PLAYMATE_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'CAMPAIGNS',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Solevo's own order, as the template's home page: hero, the category card over its edge, featured products, offer
// banners, the brand strip ("Why shop with us" last), then the rest.
export const SOLEVO_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CAMPAIGNS',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Chronics's own order, as the template's home page: hero, category cards, trending products, the feature strip, the new-arrivals banner, then the rest.
export const CHRONICS_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'HIGHLIGHTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];



// Mahabesh's own order, as the template's home page: hero, shop by category, then the product rows (on sale, new, latest).
export const MAHABESH_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'TOP_SELLING',
  'CAMPAIGNS',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Chicwove's own order, as the template's home page: hero, shop by category, new arrivals, the offer banner, then the rest.
export const CHICWOVE_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CAMPAIGNS',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

export function resolveHomeSections(saved: HomeSectionSetting[] | null | undefined, defaultOrder: HomeSectionId[] = DEFAULT_ORDER): HomeSectionId[] {
  const seen = new Set<HomeSectionId>();
  const result: HomeSectionId[] = [];
  for (const s of saved ?? []) {
    const id = s.id as HomeSectionId;
    if (!DEFAULT_ORDER.includes(id) || seen.has(id)) continue;
    seen.add(id);
    if (s.enabled) result.push(id);
  }
  for (const id of defaultOrder) {
    if (!seen.has(id)) result.push(id);
  }
  return result;
}
