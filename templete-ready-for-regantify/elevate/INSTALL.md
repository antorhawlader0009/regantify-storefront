# Elevate: install into Regantify (about 5 commands, few tokens)

Template: `templete/others-templetes/Fashion/Clothing/elevate-store/elevate-store` (minimal menswear: ink, sand, stone, serif Cormorant + Inter, square cards, tracked uppercase labels, near-black footer `#141413`).
Built 2026-11-15 from `NEW-TEMPLATE-guide.md`, on Chicwove's code (renamed `Elevate*`, prefix `el-`, tokens `--el-*`).
`wire.js` was tested on 2026-11-15 against the real repos: after it ran, `tsc --noEmit` (storefront) and `tsc -b` (client) were clean, then everything was restored. Server was not type-checked (needs `prisma generate` first).

## Install
1. `node templete-ready-for-regantify/elevate/wire.js` from the workspace root. It copies the theme, demo route and CSS block, adds the enum and the migration folder, and adds an `elevate` branch next to every `chicwove` one in 29 shared files (server, client, storefront). Safe to rerun (skips files that already have elevate). Nothing is committed.
2. Server: stop the API on :4000 if running, `cd server && npx prisma generate`, `npx prisma migrate deploy` (local Neon), then the same for production through the SSH tunnel (CLAUDE.md), then `npx tsc --noEmit`.
3. `cd storefront && npx tsc --noEmit`, `cd client && npx tsc -b`.
4. Browser check (guide section 8): put a local test store on Elevate: home, list, product, cart, wishlist, checkout, account, Bangla switch, `/template-demo/elevate`, phone width, a StorePal store unchanged.
5. Finish: add 1 to 2 sentences about Elevate to CLAUDE.md's StorePal-family paragraph, write `ELEVATE-baki-kaj.md` if anything is left, commit per repo as Antor (no co-author line), push only when the owner says.

## Decisions already made
- Plan: Elevate is last in `THEME_ORDER` (after STRIDE), so Starter and above get it and no other template changes plan. Move the line in `plans/plan-limits.service.ts` if the owner wants Basic.
- Category on the Templates page: Fashion.
- Header: the template's header floats transparently over the hero with a swipe strip; the skin keeps the shared sticky header and drawer (search, account, wishlist, phone menu) in white with the serif tracked wordmark and uppercase links. Transparent-over-hero is not done.
- Left out (no matching feature, or made-up text): "Outfit inspiration / Shop the look", "About" values, the sample service bar (only the store's own Highlights show). Template taglines live only in `demo/`.
- Footer "Got a question?" call bar: dark band, square, uppercase white buttons (block generated and patched by `wire.js`).
- Home order: HERO, CATEGORY_SHORTCUTS, TOP_SELLING, FLASH_SALE, CAMPAIGNS, CATEGORY_SECTIONS, HIGHLIGHTS, REVIEWS, MAGAZINE, FAQ, SOCIAL_FEED.
- Fonts: nothing to add (`--font-cormorant`, `--font-inter` exist).

## What still needs an eye in the browser (only visual polish)
- Product list, product page, cart, wishlist, checkout were class-swept from Chicwove (square corners, no shadows), so their layout is Chicwove's. Compare with the template's `ProductDetail.tsx`, `ProductGrid.tsx`, `app/cart/page.tsx` and adjust: the template's product page has a bigger gallery and tracked uppercase labels.
- Container width: skin uses 80rem (`.el-wrap`), template uses 1440px; change `max-width` in the CSS block if wanted.
- Header logo (store logo + name) and the dark announcement bar (Site Banner text only).
- Footer link/colour contrast on the dark footer.

## Folder
`storefront/themes/elevate/*` (parts + `demo/`), `storefront/globals.css.block`, `storefront/route-template-demo-elevate/page.tsx`, `server/migration.sql`, `snippets/*` (used by wire.js), `wire.js`.

## Lessons from the real install (2026-11-15, took about 12 minutes of wall time)
`wire.js` ran clean first time; tsc clean in storefront, client and server. Problems found only in the browser, now fixed in the kit and in `wire.js`:
1. Header wordmark: the first sed missed, so the store name was plain lowercase. Verify a sed really changed the file (grep after). Long names truncate with wide tracking, so tracking is 0.18em.
2. Dark footer: the footer rule re-points `--color-ink` to white, so any `text-ink` on a light button inside it is white on white (call bar Call button), and `--color-accent` (ink) made the developer credit link invisible. Fixed: `wire.js` `footerBlockFix` swaps `text-ink` for `#1c1b19`; footer CSS sets `--color-accent: #ffffff`. Any new template with a dark footer must check: call bar buttons, logo tile, credit link, app links.
3. Filter chips were still pill-shaped (`rounded-full`); a minimal skin should square them.
4. A page looked unstyled once after a CSS append: dev server HMR, reload fixes it. A store's theme change shows only after the 60 s page cache (or wait until the HTML has `data-skin="elevate"`).
5. **Test only on the `shopnet` store (CLAUDE.md memory).** Never switch another store's theme, not even on the local test database.
6. `tsc` takes minutes; run it once at the end, not after every file.
