# Urbanx: install into Regantify (not installed yet, kit only)

Template: `templete/others-templetes/Fashion/Clothing/urbanx/urbanx` (URBANX streetwear).
Design: near-black ink `#050505`, volt `#c8f02b` (primary button fill with ink text, tags, active underline, text on black), light grey cards `#f0f0f0`, Barlow Condensed capitals (`--font-barlow-cond`) + Inter, graffiti wordmark (Permanent Marker), black header and footer, full-picture dark hero, grayscale category tiles, square everything.
Built 2026-11-15 on Stride's code (renamed `Urbanx*`, prefix `ux-`, tokens `--ux-*`), because Stride already is black + lime + condensed capitals; the shared-file branches are still copied from the `chicwove` ones (same call shapes, checked).

## Install
1. `node templete-ready-for-regantify/urbanx/wire.js` from the workspace root (copies theme, demo route, CSS block; adds Permanent Marker to `lib/fonts.ts`; enum + migration; `urbanx` branch next to every `chicwove` one in 29 shared files; THEME_ORDER entry goes last). Rerun-safe.
2. Server: `prisma generate` (stop the API first), `migrate deploy` locally and on production through the tunnel, `tsc --noEmit`.
3. `tsc --noEmit` in storefront, `tsc -b` in client.
4. Browser check on `shopnet` only: home, list, product, cart, wishlist, checkout, account, Bangla switch, `/template-demo/urbanx`, phone width, footer contrast.
5. CLAUDE.md line, commit as Antor, push only when the owner says.

## What was verified (2026-11-15, without touching the repos)
`wire.js` was run on a scratch copy of storefront/server/client files (junction to node_modules) and `tsc --noEmit` on that copy was clean; the real repos stayed at 0 changes. Client and server were not type-checked for this template (their edits are only theme-name lists, same as the other kits), and nothing was looked at in a browser.

## Decisions and notes
- Plan: Urbanx is last in `THEME_ORDER`, so it unlocks after the templates already installed (now the 11th/12th place: Advance only). Move the line in `plans/plan-limits.service.ts` for another plan. `wire.js` (this kit and Menaura's) now puts the entry just before the `...Object.values(StoreTheme)` spread, so it no longer depends on which template came before.
- Category on the Templates page: Fashion.
- Home order: HERO, CATEGORY_SHORTCUTS, TOP_SELLING, FLASH_SALE, CAMPAIGNS, CATEGORY_SECTIONS, HIGHLIGHTS, REVIEWS, MAGAZINE, FAQ, SOCIAL_FEED. Brands row stays StorePal's own (not in the template).
- Left out (no feature, or made-up text): newsletter box and "STREET10" promo code, "Free shipping over $100", payment-card logos, the template's sample texts (demo only). The dark newsletter strip is replaced by StorePal's call bar (look `urbanx`, volt call button).
- Fixed on the way: Stride and Vaelora have a broken class `max-lg:-tranneutral-x-1/2` in their headers (it should be `-translate-x-1/2`, so their phone logo is not centred). Fixed in this kit only; the two existing templates still have it.
- Lessons from Elevate/Menaura applied: footer re-points colour variables (call bar buttons use fixed hex colours), footer logo tile forced to dark text, graffiti watermark sits behind footer content.

## Needs an eye in the browser
Hero height and text size on phones, header search pill (opens the shared search panel, the template has an inline form), the dark drawer, product card button (ink bar, volt on hover, always visible), product page and cart (Stride layout in Urbanx colours; the template's product page has a 3-column layout), grayscale category tiles with a store's real photos, `ux-tag` colours (ink for discounts, volt for New).

## Folder
`storefront/themes/urbanx/*` (+ `demo/`), `storefront/globals.css.block`, `storefront/route-template-demo-urbanx/page.tsx`, `server/migration.sql`, `snippets/*`, `fonts-patch.js`, `wire.js`.
