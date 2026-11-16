# Browser test still to do (written 2026-11-16)

Which templates have NOT been checked in a browser yet, and what to look at. When a template has been checked (home, list,
product, cart, checkout, wishlist, sign-in, search, Bangla, Contact, FAQ, `/template-demo/<name>`, phone width), move it to the
"Checked" list at the bottom. How to test (shopnet only, local): `NEW-TEMPLATE-guide.md` section 8 and the memory note
"always-browser-test-templates".

## 1. Installed on 2026-11-16, not opened in a browser at all (the owner said to test later)

Installed with `wire.js`, migrations applied on the local database only, typecheck clean (`tsc --noEmit` server and storefront,
`tsc -b` client), Bangla keys checked (`node ../scripts/check-store-text.cjs . <name>`: 0 missing). **Not applied on the live
database and not pushed yet.**

Done without a browser (static checks of the bug classes found in earlier tests): the sort/filter selects now carry `text-ink`
in all four (a page band with white text made them white on white in Drivecraft and Glowerive); Minimog got its own light
footer rule (StorePal's base rule paints every footer navy, so a light footer needs one); Novatrend and Novella's language
switch shows the chosen language in ink (orange or terracotta on white is only about 3.4:1); the dark footers (Menaura,
Novatrend, Novella) already re-point the colours and their accent reads fine on them. Menaura's body font Jost already existed
(Groceryanto added it), so its weights were widened to 300 to 600 in `lib/fonts.ts`.

### Menaura (warm menswear, mocha and ink, Cormorant Garamond + Jost, category Fashion)
- Header (the template has a fixed latte bar, here it is the shared sticky bar), hero spacing.
- Product page and cart (Chicwove layout in Menaura colours; the template's product page has a 3-column layout with a 260px side box).
- Brand colour (mocha) spots the template shows in ink; `rounded-2xl` leftovers from Chicwove.
- Jost weight 300 text on the body.

### Minimog (general Shopify-style store, forest green, Inter, no Templates category)
- Hero: the picture is multiplied onto the beige (fine for white-background product photos; a store's cover photo may look dark or odd), phone layout of the hero.
- 8 category tiles for a store with few categories; compact 12px card text next to the 14px StorePal parts (checkout, product page).
- The sale banner with real campaign pictures; product page and cart (green).
- **The new light footer rule** (background `#fafafa`, dark text, call bar inside it).

### Novatrend (general trendy store, vivid orange on black, Inter, no Templates category)
- Hero (a store's cover photo on black: under a black fade on the left, covering the right 72% on a computer, the whole screen with a dark veil on a phone), the orange glow on small phones.
- Card look in 5 columns (grey card, white photo); category cards for a store with few categories.
- The footer call bar; product page and cart (orange). White text on `#ff4b0f` is about 3.4:1 (the template's own palette).

### Novella (general marketplace, terracotta on cream, Manrope, no Templates category)
- Hero (a store's cover photo across the whole screen under a dark fade).
- The two-row header at 1024 to 1280 px (many menu links), round category pictures for a store with no category photos (first letter shown).
- Promo tile pictures (multiplied onto pale tiles, so a dark photo may look muddy), card look in 5 columns, footer call bar, product page and cart.
- Manrope loaded (Network tab) and used; `lib/fonts.ts` was patched by the kit.

## 2. Checked only by computed styles and a contrast scan (screenshots stalled on the PC), layout never seen

Greenmart, Groceryanto, Mallon (2026-11-16, already live). Look at: Greenmart home (floating category panel over the hero, deep green footer), Groceryanto (wide 550px search bar, the "All Categories" button row, light grey footer), Mallon (the two header rows, coral "All Categories" block, sand footer, gradient promo tiles on the demo page).

## 3. Earlier notes that said "not looked at in a browser"

- Mahabesh (2026-11-12): never looked at in a browser; its live migration note in `MAHABESH-baki-kaj.md`.
- Belora (2026-11-16): hero picture crop, the feature panel overlap, the phone category row were never seen.
- Stride, Vaelora, Chicwove, Chronics, Techzone, Solevo, PlayMate: built before this list; nothing recorded here about a recent check.

## 4. Kits in this folder that are not installed (not asked for yet)

evernest, papernest, petmart, quickbite, shopease, sporteq, tastehouse, technova, urbanx, viva.

## Checked in a browser (with pictures)

Elevate, Estatepro, Furnilux, Gadgetstore, Glowerive, Drivecraft (2026-11-16, on shopnet, bugs fixed and kits synced).
