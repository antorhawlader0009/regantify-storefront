// Sample data for the Novatrend template demo page (/template-demo/novatrend), taken from the template's data/products.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka
// (the template's dollars x 100). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  /** Price in taka. */
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: { text: string; sale?: boolean };
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'Essential Hoodie', category: 'Fashion', price: 6000, image: u('1620799140408-edc6dcb6d633'), rating: 4.5, reviews: 120, badge: { text: 'New' } },
  { id: 'p2', name: 'Air Max 270', category: 'Fashion', price: 13000, oldPrice: 16000, image: u('1549298916-b41d501d3772'), rating: 4.5, reviews: 98, badge: { text: '-20%', sale: true } },
  { id: 'p3', name: 'Wireless Headphone', category: 'Electronics', price: 4000, image: u('1505740420928-5e560c06d30e'), rating: 4.5, reviews: 156, badge: { text: 'New' } },
  { id: 'p4', name: 'Smart Watch Series 9', category: 'Electronics', price: 20000, oldPrice: 23000, image: u('1546868871-7041f2a55e12'), rating: 4.5, reviews: 87, badge: { text: '-15%', sale: true } },
  { id: 'p5', name: 'Stainless Steel Bottle', category: 'Fitness', price: 2500, image: u('1602143407151-7111542de6e8'), rating: 4.5, reviews: 76, badge: { text: 'New' } },
  { id: 'p6', name: 'Aviator Sunglasses', category: 'Accessories', price: 9000, oldPrice: 10000, image: u('1572635196237-14b3f281503f'), rating: 4.5, reviews: 113, badge: { text: '-10%', sale: true } },
  { id: 'p7', name: 'Classic Hoodie', category: 'Fashion', price: 6000, image: u('1556821840-3a63f95609a7'), rating: 4.5, reviews: 120 },
  { id: 'p8', name: 'Sony WH-1000XM5', category: 'Electronics', price: 35000, image: u('1583394838336-acd977736f90'), rating: 4.5, reviews: 75 },
  { id: 'p9', name: 'Leather Biker Jacket', category: 'Fashion', price: 13000, oldPrice: 16000, image: u('1551028719-00167b16eac5'), rating: 4.5, reviews: 64, badge: { text: '-19%', sale: true } },
  { id: 'p10', name: 'Bluetooth Speaker', category: 'Electronics', price: 6000, image: u('1608043152269-423dbba4e7e1'), rating: 4.5, reviews: 188 },
];

export const DEMO_CATEGORIES = [
  { name: 'Fashion', image: u('1515886657613-9f3515b0c78f', 700) },
  { name: 'Electronics', image: u('1546435770-a3e426bf472b', 700) },
  { name: 'Beauty', image: u('1556228720-195a672e8a03', 700) },
  { name: 'Fitness', image: u('1571019613454-1cb2f99b2d8b', 700) },
  { name: 'Home Decor', image: u('1555041469-a586c61ea9bc', 700) },
  { name: 'Accessories', image: u('1523170335258-f5ed11844a49', 700) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1483985988355-763728e1935b', 1600), eyebrow: 'Trending Now', title: ['Discover Products'], accent: 'You’ll Love', text: 'Shop the latest trending products curated for modern lifestyles.' },
  { key: 's2', image: u('1542291026-7eec264c27ff', 1600), eyebrow: 'Flash Sale', title: ['Up To'], accent: '70% Off', text: 'Limited time deals on sneakers, tech and everyday essentials.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Flash Sale', title: 'Up To 70% Off', cta: 'Shop Sale Now', image: u('1542291026-7eec264c27ff', 1200) },
  { key: 'b', kicker: 'New Collection', title: 'Summer 2025', cta: 'Shop Collection', image: u('1518611012118-696072aa579a', 1200) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳5,000' },
  { key: 'f2', title: 'Secure Payments', text: '100% secure checkout' },
  { key: 'f3', title: 'Easy Returns', text: '30-day return policy' },
  { key: 'f4', title: '24/7 Support', text: 'Always here to help' },
];
