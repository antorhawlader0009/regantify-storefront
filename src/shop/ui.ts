/**
 * The Regantify Shop website's look (2026-11-03 redesign): the same red/coral marketplace design as the Regantify app (the owner's
 * reference picture, app/store/design-reference/marketplace-reference.jpg). ONE accent colour, set as CSS variables on the Shop layout
 * (app/shop/layout.tsx), so changing it is one line there. White cards with soft shadows instead of borders, everything rounded, buttons
 * and chips fully rounded, bold dark headings. Class strings are kept whole here so Tailwind finds them.
 */

export const SHOP_ACCENT = '#F2484B';
export const SHOP_ACCENT_DARK = '#D93A3D';
export const SHOP_ACCENT_SOFT = '#FDEDED';

export const ui = {
  accentText: 'text-[var(--shop-accent)]',
  accentBg: 'bg-[var(--shop-accent)]',
  softBg: 'bg-[var(--shop-soft)]',
  /** The main action: a solid accent pill. */
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--shop-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--shop-accent-dark)] disabled:cursor-not-allowed disabled:bg-slate-300',
  /** A second action: an accent outline pill. */
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-full border border-[var(--shop-accent)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--shop-accent)] transition hover:bg-[var(--shop-soft)] disabled:opacity-60',
  /** A quiet action: grey outline pill. */
  quiet: 'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)]',
  /** A white card with a soft shadow. */
  card: 'rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]',
  /** Form fields. */
  field:
    'mt-1 block w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--shop-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--shop-accent)]/15',
  label: 'block text-sm font-medium text-slate-800',
  /** A pill chip; `on` is the selected one. */
  chip: (on: boolean) =>
    `inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm transition ${
      on ? 'bg-[var(--shop-accent)] font-medium text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)]'
    }`,
  /** A square option chip (size, weight...). */
  option: (on: boolean, out = false) =>
    `min-w-11 rounded-lg px-3 py-2 text-sm font-medium transition ${
      on ? 'bg-[var(--shop-accent)] text-white' : `border border-slate-200 bg-white hover:border-[var(--shop-accent)] ${out ? 'text-slate-400 line-through' : 'text-slate-800'}`
    }`,
  sectionTitle: 'text-lg font-bold text-slate-900',
  seeAll: 'text-sm font-medium text-[var(--shop-accent)] hover:underline',
} as const;
