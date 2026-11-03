import { permanentRedirect } from 'next/navigation';

// The Shop has no Reseller tab any more (2026-11-03): stores find products to resell in their dashboard (Marketing > Reseller), and the Shop
// shows only products shoppers can buy. Old links land on the Shop's home.
export default function ShopResellerPage() {
  permanentRedirect('/shop');
}
