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
  | 'REVIEWS';

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
];

/**
 * The sections to show, in order: the vendor's saved list (turned-off ones
 * dropped, unknown or repeated ids ignored), then any section they haven't
 * placed yet (one added to StorePal after they saved), which is shown.
 */
export function resolveHomeSections(saved: HomeSectionSetting[] | null | undefined): HomeSectionId[] {
  const seen = new Set<HomeSectionId>();
  const result: HomeSectionId[] = [];
  for (const s of saved ?? []) {
    const id = s.id as HomeSectionId;
    if (!DEFAULT_ORDER.includes(id) || seen.has(id)) continue;
    seen.add(id);
    if (s.enabled) result.push(id);
  }
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) result.push(id);
  }
  return result;
}
