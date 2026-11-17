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



// TechZone's own order, as the template's home page: hero, shop by category, best sellers, recommended, the two promo
// banners, then the rest.
export const STRIDE_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// TechZone's own order, as the template's home page: hero, shop by category, best sellers, recommended, the two promo
// banners, then the rest.
export const VAELORA_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// TechZone's own order, as the template's home page: hero, shop by category, best sellers, recommended, the two promo
// banners, then the rest.
export const TECHZONE_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'HIGHLIGHTS',
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

// Sporteq's own order, as the template's home page: the full-picture hero, the benefits strip, the round category row, best sellers, the two promo banners, then the rest.
export const SPORTEQ_ORDER: HomeSectionId[] = [
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

// Shopease's own order, as the template's home page: dark photo hero, shop by category (tall cards), the peach deal panel, new arrivals, then the feature strip.
export const SHOPEASE_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Quickbite's own order, as the template's home page: the hero, the round category row, popular dishes, today's deals, the banner, then the feature strip.
export const QUICKBITE_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Petmart's own order, as the template's home page: the peach hero card, the category row, products, the two offer tiles, then the features strip.
export const PETMART_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Papernest's own order, as the template's home page: the pastel hero, the round category row, the two promo tiles, new arrivals, then best sellers and the rest.
export const PAPERNEST_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'CAMPAIGNS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Novella's own order, as the template's home page: hero, shop by category (round pictures), the three promo tiles, trending products, more products, then the feature strip.
export const NOVELLA_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'CAMPAIGNS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Novatrend's own order, as the template's home page: hero, the feature strip, shop by categories, new arrivals, best sellers, then the promo tiles.
export const NOVATREND_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'CAMPAIGNS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Minimog's own order, as the template's home page: hero, a light feature strip, shop by category, the sale banner, then trending products.
export const MINIMOG_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Menaura's own order, as the template's home page: hero, essentials (categories), the offer banner, then trending products.
export const MENAURA_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Mallon's own order, as the template's home page: hero, a plain feature strip, shop by category, the promo tiles, then the popular products.
export const MALLON_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'CAMPAIGNS',
  'FLASH_SALE',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Groceryanto's own order, as the template's home page: the wide banner, a plain category row, the vegetable products, the promo banner, the sale grid, then the benefits row.
export const GROCERYANTO_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'CAMPAIGNS',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Greenmart's own order, as the template's home page: the full-width hero, the floating category panel, the pale green offer panels, new arrivals, then popular products and the feature row.
export const GREENMART_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Glowerive's own order, as the template's home page: hero, the pale feature panel (it overlaps the hero), shop by category, featured products, the offer band.
export const GLOWERIVE_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'TOP_SELLING',
  'FLASH_SALE',
  'CAMPAIGNS',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Gadgetstore's own order, as the template's home page: the light hero, the benefits strip, the round category row, best sellers, the two promo tiles, then the rest.
export const GADGETSTORE_ORDER: HomeSectionId[] = [
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

// Furnilux's own order, as the template's home page: hero, shop by room, featured products, brands, then the offer banner.
export const FURNILUX_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'HIGHLIGHTS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Estatepro's own order, as the template's home page: the full-screen hero, the image category cards, the dark trust block, the listings, the dark contact bar.
export const ESTATEPRO_ORDER: HomeSectionId[] = [
  'HERO',
  'CATEGORY_SHORTCUTS',
  'HIGHLIGHTS',
  'TOP_SELLING',
  'CAMPAIGNS',
  'FLASH_SALE',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Drivecraft's own order, as the template's home page: hero, shop by category, featured products, the promo banners, then the rest.
export const DRIVECRAFT_ORDER: HomeSectionId[] = [
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

// Belora's own order, as the template's home page: hero, the pale feature panel, shop by category, the "self care" split band, then best sellers.
export const BELORA_ORDER: HomeSectionId[] = [
  'HERO',
  'HIGHLIGHTS',
  'CATEGORY_SHORTCUTS',
  'FLASH_SALE',
  'CAMPAIGNS',
  'TOP_SELLING',
  'CATEGORY_SECTIONS',
  'REVIEWS',
  'MAGAZINE',
  'FAQ',
  'SOCIAL_FEED',
];

// Elevate's own order, as the template's home page: hero, shop by category, new arrivals, the seasonal banner, then the rest.
export const ELEVATE_ORDER: HomeSectionId[] = [
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
