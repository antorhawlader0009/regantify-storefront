# Menaura: install into Regantify (not installed yet, kit only)

Template: `templete/others-templetes/Fashion/Clothing/mens-store/mens-store` (MENAURA, warm menswear).
Design: cream `#faf6f2`, latte header bar `#e9dacb`, sand `#f0e8e0`, mocha `#7a5c40` (highlights), ink `#2b2420` (buttons, accent), stone `#6a5d54`, footer `#2b2420`.
Cormorant Garamond headings + Jost body, rounded-xl white cards with soft shadow and a 3:4 photo, rounded-md ink buttons, ink rounded-2xl offer banner.
Built 2026-11-15 on Chicwove's code (renamed `Menaura*`, prefix `mn-`, tokens `--mn-*`), then restyled.

## Install (same as Elevate)
1. `node templete-ready-for-regantify/menaura/wire.js` from the workspace root (copies theme, demo route, CSS block; adds Jost to `lib/fonts.ts`; enum + migration; `menaura` branch next to every `chicwove` one in 29 shared files). Rerun-safe.
2. Server: `prisma generate` (stop the API first), `migrate deploy` locally and on production through the tunnel, `tsc --noEmit`.
3. `tsc --noEmit` in storefront, `tsc -b` in client.
4. Browser check on the `shopnet` store only (never another store), including footer contrast, phone width, checkout, wishlist, account.
5. CLAUDE.md line, commit as Antor, push only when the owner says.

## State of the kit
- Checked once on 2026-11-15: after `wire.js`, `tsc --noEmit` (storefront) and `tsc -b` (client) were clean. Everything was then restored. Server was not type-checked, browser was not looked at.
- Lessons from Elevate already applied: footer rule gives `--color-accent` latte (credit link visible), call-bar block gets `text-[#2b2420]` instead of `text-ink`, footer logo tile forced to dark text, store name uses `tracking-wide`.
- Decision: THEME_ORDER puts Menaura after Elevate, so it unlocks on the Advance plan only (11th). Move the line in `plans/plan-limits.service.ts` if the owner wants Starter or Basic.
- Category on the Templates page: wire does not add one for MENAURA unless the `THEME_CATEGORIES` line is copied: it is (copied from CHICWOVE: Fashion).
- Home order: HERO, CATEGORY_SHORTCUTS, FLASH_SALE, CAMPAIGNS, TOP_SELLING, CATEGORY_SECTIONS, HIGHLIGHTS, REVIEWS, MAGAZINE, FAQ, SOCIAL_FEED.
- Left out (no feature, or made-up text): the template's trending filter chips, newsletter box, "Limited Time Offer / Autumn Collection" texts (demo only).

## Needs an eye in the browser
Header (fixed latte bar in the template, shared sticky bar here), hero spacing, product page and cart (Chicwove layout with Menaura colours; the template's product page has a 3-column layout with a 260px side box), brand colour (mocha) spots that the template shows in ink, rounded `rounded-2xl` leftovers from Chicwove.

## Folder
`storefront/themes/menaura/*` (+ `demo/`), `storefront/globals.css.block`, `storefront/route-template-demo-menaura/page.tsx`, `server/migration.sql`, `snippets/*`, `fonts-patch.js`, `wire.js`.
