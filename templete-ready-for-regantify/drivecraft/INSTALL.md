# Drivecraft: install into Regantify (not installed yet, kit only)

Template: `templete/others-templetes/AutoMobile/drivecraft/drivecraft` (DRIVECRAFT, auto accessories and riding gear).
Design: ink `#0c0c0d` header and footer, light grey page `#f3f3f3`, racing red `#d3161d` (primary buttons, tags, prices, section lines, white text on red), Roboto Condensed bold italic capitals (`--font-roboto-cond`) + Inter, square corners, white cards with a soft shadow, a gradient page band (ink to deep red `#5a0a0d`), a red-gradient call band above the footer.
Built 2026-11-15 on the Urbanx kit (itself Stride's code), renamed `Drivecraft*`, prefix `dc-`, tokens `--dc-*`, then recoloured and restyled. Shared-file branches are copied from the `chicwove` ones like the other kits.

## Install
1. `node templete-ready-for-regantify/drivecraft/wire.js` from the workspace root (theme, demo route, CSS block, Roboto Condensed in `lib/fonts.ts`, enum + migration, `drivecraft` branch next to every `chicwove` one in 29 shared files, THEME_ORDER entry last). Rerun-safe.
2. Server: `prisma generate` (stop the API first), `migrate deploy` locally and on production through the tunnel, `tsc --noEmit`.
3. `tsc --noEmit` in storefront, `tsc -b` in client.
4. Browser check on `shopnet` only: home, list, product, cart, wishlist, checkout, account, Bangla switch, `/template-demo/drivecraft`, phone width, footer contrast.
5. CLAUDE.md line, commit as Antor, push only when the owner says.

## What was verified (2026-11-15, repos untouched)
`wire.js` ran on a scratch copy of the storefront/server/client files (junction to node_modules); `tsc --noEmit` there was clean (with Elevate already installed in the repo, but not Menaura or Urbanx). Client and server were not type-checked (their edits are only theme-name lists), nothing was looked at in a browser. Repos stayed at 0 changes.

## Decisions and notes
- Plan: last in `THEME_ORDER` (inserted before the `...Object.values(StoreTheme)` spread), so it goes to the plan after the templates installed before it.
- Category on the Templates page: none added (`wire.js` skips the `THEME_CATEGORIES` line), so it shows under Others only. Add a line there if the owner wants an Auto tab.
- Home order: HERO, CATEGORY_SHORTCUTS, TOP_SELLING (called "Featured Products"), FLASH_SALE, CAMPAIGNS, CATEGORY_SECTIONS, HIGHLIGHTS, REVIEWS, MAGAZINE, FAQ, SOCIAL_FEED.
- Left out on purpose (no such feature, or made-up text): "Shop by Vehicle" (cars, bikes, scooters, trucks), the "Shop for:" vehicle chips in the hero, vehicle fitment line on cards, Bundles, Guides, the template's Help/Track-order pages, the "We accept" brand badges (bKash, Visa and so on: brand rule), newsletter box. Blog and FAQ exist as StorePal's Magazine and FAQ sections. The tagline "Gear Up. Drive Proud." is demo only.
- Logo: the red skewed arrow mark shows only when the store has no logo picture; the name is set in italic capitals.
- Page band: `dc-band` (ink to deep red) is used by `DrivecraftPageHeader`; the breadcrumb switches to white text inside it.
- Lessons applied: footer re-points colour variables, so call-bar buttons use fixed hex colours (ink button on the red band, white outline WhatsApp), footer accent is a light red (`#ff5a60`) so links stay readable on black, footer logo tile forced dark text, no watermark.

## Needs an eye in the browser
Header (sticky black bar; template has a "Shop by Category" mega dropdown, here the shared category strip and search panel), card look (white, square photo, red price, ink Add to Cart bar that turns red; Buy Now line button under it), product page and cart (Stride/Urbanx layout in these colours), category cards (4:3 photo, only 6 shown), hero height, the red call band sits inside the page width with padding, not full width like the template's newsletter band.

## Folder
`storefront/themes/drivecraft/*` (+ `demo/`), `storefront/globals.css.block`, `storefront/route-template-demo-drivecraft/page.tsx`, `server/migration.sql`, `snippets/*`, `fonts-patch.js`, `wire.js`.
