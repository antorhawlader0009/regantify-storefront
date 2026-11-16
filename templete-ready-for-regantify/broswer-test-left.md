# Browser test still to do (written 2026-11-16, updated the same day)

Which templates have NOT been checked in a browser yet, and what to look at. When a template has been checked (home, list,
product, cart, checkout, wishlist, sign-in, search, Bangla, Contact, FAQ, `/template-demo/<name>`, phone width), move it to the
"Checked" list at the bottom. How to test (shopnet only, local): `NEW-TEMPLATE-guide.md` section 8 and the memory note
"always-browser-test-templates".

## 1. Checked only by computed styles and a contrast scan (screenshots stalled on the PC then), layout never seen

Petmart (2026-11-16, found by the contrast scan, page widths and structure checks only: screenshots of its pages hung, so its hero card, category panel, round cart buttons and footer were never seen), Greenmart, Groceryanto, Mallon (2026-11-16, already live). Look at: Greenmart home (floating category panel over the hero, deep green footer), Groceryanto (wide 550px search bar, the "All Categories" button row, light grey footer), Mallon (the two header rows, coral "All Categories" block, sand footer, gradient promo tiles on the demo page).

## 2. Earlier notes that said "not looked at in a browser"

- Mahabesh (2026-11-12): never looked at in a browser; its live migration note in `MAHABESH-baki-kaj.md`.
- Belora (2026-11-16): hero picture crop, the feature panel overlap, the phone category row were never seen.
- Stride, Vaelora, Chicwove, Chronics, Techzone, Solevo, PlayMate: built before this list; nothing recorded here about a recent check.

## 3. Small things not checked even for the four templates tested on 2026-11-16

- Novella: the two-row header at 1024 to 1280 px (the window was one size only), Bangla view.
- Novatrend: the white "WhatsApp" outline button on the orange call bar looks faint (white on orange is 3.4:1, the template's own palette).
- Minimog: the hero with a store's own photo (the demo shows the template's backpack photo).
- Papernest, Petmart, Quickbite, Shopease: no Bangla view checked except Shopease; Papernest hero rainbow text line and Quickbite glass blur on a low-end phone were not looked at; phone width was checked by page width only (no sideways scroll), not by pictures.

## 4. Kits in this folder that are not installed (not asked for yet)

evernest, sporteq, tastehouse, technova, urbanx, viva.

## Checked in a browser (with pictures)

Elevate, Estatepro, Furnilux, Gadgetstore, Glowerive, Drivecraft, Menaura, Minimog, Novatrend, Novella, Papernest, Quickbite, Shopease (2026-11-16, on shopnet, bugs fixed and kits synced).
