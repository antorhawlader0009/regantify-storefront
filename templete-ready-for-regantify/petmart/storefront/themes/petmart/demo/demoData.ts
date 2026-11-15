// Sample data for the Petmart template demo page (/template-demo/petmart), after the template's lib/data.ts and lib/images.ts.
// The template draws its product pictures itself; the demo uses the template's own Unsplash pet photos (free to use under the
// Unsplash License). Prices are sample prices in taka (the template's dollars x 120, to the nearest 10). Nothing here reaches a
// real store.
const u = (id: string, w = 700) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 10) * 10;

export interface DemoProduct {
  id: number;
  name: string;
  /** Price in taka. */
  price: number;
  rating: number;
  reviews: number;
  image: string;
}

const P = (id: number, name: string, usd: number, rating: number, reviews: number, photo: string): DemoProduct => ({ id, name, price: taka(usd), rating, reviews, image: u(photo) });

export const DEMO_PRODUCTS: DemoProduct[] = [
  P(1, 'Happy Paws Chicken & Rice Dog Food', 24.99, 4.5, 238, '1587300003388-59208cc962cb'),
  P(2, "Whisker's Choice Salmon Recipe Cat Food", 21.99, 4.5, 176, '1514888286974-6c03e2ca1dba'),
  P(3, 'PawPlay Plush Dog Toy (With Squeaker)', 12.99, 4.5, 320, '1612536057832-2ff7ead58194'),
  P(4, 'CloudPaws Pet Bed Ultra Soft & Cozy', 29.99, 4.5, 189, '1583511655857-d19b40a7a54e'),
  P(5, 'Crunchy Bones Dog Treats', 8.99, 4.5, 412, '1552053831-71594a27632d'),
  P(6, 'Tuna Bites Soft Cat Treats', 6.49, 4, 154, '1495360010541-f48722b34f7d'),
  P(7, 'BounceBall Tennis Balls (3 Pack)', 9.99, 4.5, 267, '1548199973-03cce0bbc87b'),
  P(8, 'FeatherFun Wand Cat Toy', 7.99, 4.5, 131, '1573865526739-10659fec78a5'),
  P(9, 'GentleGlide Grooming Brush', 11.99, 4, 143, '1561037404-61cd46aa615b'),
  P(10, 'VitaPaws Daily Multivitamin Chews', 18.99, 5, 205, '1587300003388-59208cc962cb'),
];

export const DEMO_CATEGORIES = [
  { name: 'Dog Food', image: u('1587300003388-59208cc962cb', 300) },
  { name: 'Cat Food', image: u('1514888286974-6c03e2ca1dba', 300) },
  { name: 'Treats', image: u('1552053831-71594a27632d', 300) },
  { name: 'Toys', image: u('1548199973-03cce0bbc87b', 300) },
  { name: 'Beds & Furniture', image: u('1583511655857-d19b40a7a54e', 300) },
  { name: 'Collars & Leashes', image: u('1612536057832-2ff7ead58194', 300) },
  { name: 'Grooming', image: u('1561037404-61cd46aa615b', 300) },
  { name: 'Health & Wellness', image: u('1573865526739-10659fec78a5', 300) },
  { name: 'Small Pets', image: u('1495360010541-f48722b34f7d', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1552053831-71594a27632d', 2000), eyebrow: 'Love . Care . Shop', title: ['Everything Your Pet Needs'], text: 'Premium products for happier, healthier pets.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Explore our toy collection for endless fun!', title: 'Play More\nWag More', cta: 'Shop Toys', image: u('1587300003388-59208cc962cb', 1000) },
  { key: 'b', kicker: 'Save up to 30% on select wellness products.', title: 'Healthy Pets\nHappier Tomorrows', cta: 'Shop Wellness', image: u('1573865526739-10659fec78a5', 1000) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'on orders over ৳6,000' },
  { key: 'f2', title: 'Secure Payments', text: '100% safe & encrypted' },
  { key: 'f3', title: 'Easy Returns', text: 'Hassle-free within 30 days' },
  { key: 'f4', title: 'Trusted by Pet Lovers', text: '50,000+ happy customers' },
];
