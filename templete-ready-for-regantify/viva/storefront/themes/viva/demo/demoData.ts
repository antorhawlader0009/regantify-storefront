// Sample data for the Viva template demo page (/template-demo/viva), taken from the template's lib/data.ts and lib/images.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka
// (the template's dollars x 120, to the nearest 10). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 10) * 10;

export interface DemoProduct {
  id: number;
  name: string;
  /** Prices in taka. */
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  image: string;
}

const mk = (id: number, name: string, photo: string, price: number, oldPrice: number, rating: number, reviews: number): DemoProduct => ({
  id,
  name,
  image: u(photo),
  price: taka(price),
  oldPrice: taka(oldPrice),
  rating,
  reviews,
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  mk(1, 'Noise Cancelling Headphones', 'photo-1505740420928-5e560c06d30e', 79.99, 99.99, 4.5, 1234),
  mk(2, 'Linen Casual Shirt', 'photo-1596755094514-f87e34085b2c', 29.99, 39.99, 4.5, 812),
  mk(3, 'Minimalist Niacinamide Serum', 'photo-1620916566398-39f1143ab7be', 16.99, 19.99, 4.5, 645),
  mk(4, 'Compact Coffee Maker', 'photo-1585515320310-259814833e62', 48.99, 69.99, 4.5, 963),
  mk(5, 'Urban Travel Backpack', 'photo-1553062407-98eeb64c6a62', 39.99, 49.99, 4.5, 1108),
  mk(6, 'Everyday Leather Handbag', 'photo-1584917865442-de89df76afd3', 54.99, 74.99, 4, 421),
  mk(7, 'Classic Low-Top Sneakers', 'photo-1549298916-b41d501d3772', 59.99, 79.99, 4.5, 2210),
  mk(8, 'Accent Armchair', 'photo-1567538096630-e0c55bd6374c', 129.99, 169.99, 4, 318),
  mk(9, 'Smart Fitness Watch', 'photo-1546868871-7041f2a55e12', 89.99, 119.99, 4.5, 1520),
  mk(10, 'Classic Analog Watch', 'photo-1523275335684-37898b6baf30', 69.99, 99.99, 4.5, 740),
];

export const DEMO_CATEGORIES = [
  { name: 'Electronics', image: u('photo-1505740420928-5e560c06d30e', 300) },
  { name: 'Fashion', image: u('photo-1596755094514-f87e34085b2c', 300) },
  { name: 'Home & Living', image: u('photo-1585515320310-259814833e62', 300) },
  { name: 'Beauty', image: u('photo-1620916566398-39f1143ab7be', 300) },
  { name: 'Sports', image: u('photo-1517836357463-d25dfeac3438', 300) },
  { name: 'Toys & Kids', image: u('photo-1558060370-d644479cb6f7', 300) },
  { name: 'Books', image: u('photo-1512820790803-83ca734da794', 300) },
  { name: 'Pet Supplies', image: u('photo-1587300003388-59208cc962cb', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1488646953014-85cb44e25828', 1600), title: ['Elevate Your Everyday'], text: 'Discover quality products across every category, made for the way you live.' },
  { key: 's2', image: u('photo-1441986300917-64674bd600d8', 1600), title: ['Fresh Finds,', 'Every Week'], text: "New arrivals in fashion, home and tech, curated so you don't have to search." },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'New Arrivals', title: 'Fresh Styles\nJust In', cta: 'Shop Now', image: u('photo-1584917865442-de89df76afd3', 700) },
  { key: 'b', kicker: 'Home Refresh', title: 'Make Your\nSpace Better', cta: 'Shop Now', image: u('photo-1567538096630-e0c55bd6374c', 700) },
  { key: 'c', kicker: 'Tech Essentials', title: 'Upgrade Your\nLifestyle', cta: 'Shop Now', image: u('photo-1546868871-7041f2a55e12', 700) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳5,900' },
  { key: 'f2', title: 'Easy Returns', text: '30 days return policy' },
  { key: 'f3', title: 'Secure Payments', text: '100% secure checkout' },
  { key: 'f4', title: '24/7 Support', text: "We're here to help" },
];
