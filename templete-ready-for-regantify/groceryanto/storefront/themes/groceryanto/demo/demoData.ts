// Sample data for the Groceryanto template demo page (/template-demo/groceryanto), after the template's data/products.ts.
// The template ships its own product pictures; the demo uses Unsplash photos of the same things (free to use under the Unsplash
// License). Prices are sample prices in taka (the template's dollars x 120, to the nearest 10). Nothing here reaches a real store.
const u = (id: string, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 10) * 10;

export interface DemoProduct {
  id: string;
  name: string;
  /** Prices in taka. */
  price: number;
  salePrice?: number;
  image: string;
}

const P = (id: string, name: string, photo: string, usd: number, saleUsd?: number): DemoProduct => ({
  id,
  name,
  price: taka(usd),
  salePrice: saleUsd ? taka(saleUsd) : undefined,
  image: u(photo),
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  P('p1', 'Organic Apples', 'photo-1560806887-1e4cd0b6cbd6', 20, 17),
  P('p2', 'Organic Banana', 'photo-1571771894821-ce9b6c11b08e', 22),
  P('p3', 'Organic Broccoli', 'photo-1459411621453-7b03977f4bfc', 22),
  P('p4', 'Organic Capsicum', 'photo-1563565375-f3fdfdbefa83', 22),
  P('p5', 'Organic Grapes', 'photo-1537640538966-79f369143f8f', 22, 20),
  P('p6', 'Butter Cheese', 'photo-1486297678162-eb2a19b0a32d', 24, 20),
  P('p7', 'Milk Products', 'photo-1550583724-b2692b85b150', 20, 18),
  P('p8', 'Dry Fruits', 'photo-1599599810769-bcde5a160d32', 22, 20),
  P('p9', 'Fruit Juice', 'photo-1600271886742-f049cd451bba', 20, 19),
  P('p10', 'Mineral Water', 'photo-1548839140-29a749e1cf4d', 10, 8),
];

export const DEMO_CATEGORIES = [
  { name: 'Beverages', image: u('photo-1600271886742-f049cd451bba', 300) },
  { name: 'Dairy Products', image: u('photo-1550583724-b2692b85b150', 300) },
  { name: 'FoodGrains & Oil', image: u('photo-1586201375761-83865001e31c', 300) },
  { name: 'Personal Care', image: u('photo-1556228720-195a672e8a03', 300) },
  { name: 'Pet Care', image: u('photo-1587300003388-59208cc962cb', 300) },
  { name: 'Vegetables & Fruits', image: u('photo-1540420773420-3366772f4999', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1542838132-92c53300491e', 2000), eyebrow: 'Organic fresh', title: ['Fresh Groceries,'], accent: 'Delivered Daily', text: 'Organic vegetables, fruits, dairy and everyday essentials.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Sale is live', title: 'Up to 20% off\non fresh groceries', cta: 'Shop Now', image: u('photo-1610832958506-aa56368176cf', 900) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free & Fast Delivery', text: 'On all orders over ৳3,500' },
  { key: 'f2', title: 'Join Risk Free', text: '14 days refund guarantee' },
  { key: 'f3', title: 'Premium Support', text: 'We are always online' },
  { key: 'f4', title: 'Secure Payment', text: '100% safe gateways' },
];
