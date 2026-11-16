// Sample data for the Novella template demo page (/template-demo/novella), taken from the template's lib/data.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka
// (the template's dollars x 100). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'Wireless Earbuds Pro', category: 'Electronics', price: 5999, oldPrice: 8999, image: u('photo-1590658268037-6bf12165a8df'), rating: 4.5, reviews: 1200 },
  { id: 'p2', name: 'Minimalist Backpack', category: 'Fashion', price: 3499, oldPrice: 5999, image: u('photo-1553062407-98eeb64c6a62'), rating: 4.5, reviews: 845 },
  { id: 'p3', name: 'Scented Candle', category: 'Home & Living', price: 1899, oldPrice: 2999, image: u('photo-1603006905003-be475563bc59'), rating: 4.5, reviews: 632 },
  { id: 'p4', name: 'Smart Watch Series 8', category: 'Electronics', price: 12999, oldPrice: 19999, image: u('photo-1523275335684-37898b6baf30'), rating: 4.5, reviews: 973 },
  { id: 'p5', name: 'Skincare Set', category: 'Beauty', price: 2499, oldPrice: 3999, image: u('photo-1556228720-195a672e8a03'), rating: 4.5, reviews: 1100 },
  { id: 'p6', name: 'Bluetooth Speaker', category: 'Electronics', price: 3999, oldPrice: 6999, image: u('photo-1608043152269-423dbba4e7e1'), rating: 4.4, reviews: 520 },
  { id: 'p7', name: 'Oversized Hoodie', category: 'Fashion', price: 2999, oldPrice: 4999, image: u('photo-1556821840-3a63f95609a7'), rating: 4.6, reviews: 760 },
  { id: 'p8', name: 'Coffee Maker', category: 'Home & Living', price: 4999, oldPrice: 8999, image: u('photo-1517668808822-9ebb02f2a0e6'), rating: 4.3, reviews: 410 },
  { id: 'p9', name: 'Makeup Kit', category: 'Beauty', price: 1999, oldPrice: 3499, image: u('photo-1512496015851-a90fb38ba796'), rating: 4.4, reviews: 690 },
  { id: 'p10', name: 'Running Sneakers', category: 'Fashion', price: 7499, oldPrice: 10999, image: u('photo-1542291026-7eec264c27ff'), rating: 4.6, reviews: 1020 },
];

export const DEMO_CATEGORIES = [
  { name: 'Electronics', image: u('photo-1505740420928-5e560c06d30e', 400) },
  { name: 'Fashion', image: u('photo-1556821840-3a63f95609a7', 400) },
  { name: 'Home & Living', image: u('photo-1503602642458-232111445657', 400) },
  { name: 'Beauty', image: u('photo-1541643600914-78b084683601', 400) },
  { name: 'Baby & Kids', image: u('photo-1558060370-d644479cb6f7', 400) },
  { name: 'Sports', image: u('photo-1517836357463-d25dfeac3438', 400) },
  { name: 'Books', image: u('photo-1512820790803-83ca734da794', 400) },
  { name: 'Groceries', image: u('photo-1542838132-92c53300491e', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1586023492125-27b2c045efd7', 2000), eyebrow: 'Trending Now', title: ['Everything You Love,'], accent: 'All in One Place.', text: 'Shop top-quality products across all categories with unbeatable prices and a seamless experience.' },
  { key: 's2', image: u('photo-1445205170230-053b83016050', 2000), eyebrow: 'New Season', title: ['Fresh Styles,'], accent: 'Just Landed.', text: 'Explore the latest arrivals in fashion, home and electronics, curated for modern lifestyles.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Deal of the Day', title: 'Up to 60% Off', cta: 'Shop Deals', image: u('photo-1523275335684-37898b6baf30', 700) },
  { key: 'b', kicker: 'New Arrivals', title: 'Fresh Finds', cta: 'Explore Now', image: u('photo-1542291026-7eec264c27ff', 700) },
  { key: 'c', kicker: 'Member Exclusive', title: 'Extra 10% Off', cta: 'Shop Now' },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳5,000' },
  { key: 'f2', title: 'Easy Returns', text: '30-day money back' },
  { key: 'f3', title: 'Secure Payments', text: '100% protected checkout' },
  { key: 'f4', title: '24/7 Support', text: "We're here to help" },
];
