// Sample data for the Technova template demo page (/template-demo/technova), taken from the template's lib/data.ts. Photos are the
// template's own Unsplash photos (free to use under the Unsplash License); prices are the template's sample prices in taka. Nothing
// here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface DemoProduct {
  id: number;
  name: string;
  tagline?: string;
  /** Price in taka. */
  price: number;
  rating: number;
  reviews: number;
  image: string;
}

const P = (id: number, name: string, price: number, rating: number, reviews: number, photo: string, tagline?: string): DemoProduct => ({ id, name, tagline, price, rating, reviews, image: u(photo) });

export const DEMO_PRODUCTS: DemoProduct[] = [
  P(1, 'NovaBook Pro 14', 249999, 4.5, 1200, '1496181133206-80ce9b88a853', 'Power Meets Portability'),
  P(2, 'Zenix X1 5G', 189999, 4.5, 856, '1610945415295-d9bbf067e59c', 'Capture More Possibilities'),
  P(3, 'TuneFlow Pro', 24999, 4.5, 2100, '1590658268037-6bf12165a8df', 'Pure Sound, No Limits'),
  P(4, 'FitNova Max', 34999, 4.5, 1400, '1523275335684-37898b6baf30', 'Healthier. Happier. You.'),
  P(5, 'NovaPlay Controller', 18999, 4.5, 743, '1606144042614-b2417e99c4e3', 'Game Beyond Limits'),
  P(6, 'Smart LED Monitor', 89999, 4.4, 410, '1527443224154-c4a3942d3acf'),
  P(7, 'Wireless Keyboard', 12999, 4.3, 365, '1587829741301-dc798b83add3'),
  P(8, '4K Action Camera', 39999, 4.6, 292, '1516035069371-29a1b244cc32'),
  P(9, 'NovaTab 11', 64999, 4.5, 512, '1544244015-0df4b3ffc6b0', 'Create On The Go'),
  P(10, 'SoundWave Over-Ear', 21999, 4.5, 1100, '1583394838336-acd977736f90', 'Immersive Audio'),
];

export const DEMO_CATEGORIES = [
  { name: 'Laptops', image: u('1496181133206-80ce9b88a853', 400) },
  { name: 'Smartphones', image: u('1610945415295-d9bbf067e59c', 400) },
  { name: 'Audio', image: u('1505740420928-5e560c06d30e', 400) },
  { name: 'Wearables', image: u('1523275335684-37898b6baf30', 400) },
  { name: 'Smart Home', image: u('1608043152269-423dbba4e7e1', 400) },
  { name: 'Gaming', image: u('1606144042614-b2417e99c4e3', 400) },
  { name: 'Cameras', image: u('1516035069371-29a1b244cc32', 400) },
  { name: 'Accessories', image: u('1553062407-98eeb64c6a62', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1511707171634-5f897ff02aa9', 1600), eyebrow: 'Next Gen Tech', title: ['A Smarter', 'Tomorrow'], accent: 'Starts Here', text: 'Explore the latest devices. Upgrade your lifestyle.' },
  { key: 's2', image: u('1606144042614-b2417e99c4e3', 1600), eyebrow: 'Next Gen Tech', title: ['Power Meets', 'Performance'], accent: 'Play Without Limits', text: 'Next-gen gaming gear built to win every match.' },
  { key: 's3', image: u('1505740420928-5e560c06d30e', 1600), eyebrow: 'Next Gen Tech', title: ['Sound That', 'Moves You'], accent: 'Hear the Difference', text: 'Premium audio. Pure clarity. All day battery.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Top Tech. Lower Prices.', title: 'FLASH OFFERS', cta: 'Shop Now', image: u('1505740420928-5e560c06d30e', 800) },
  { key: 'b', kicker: 'Be the First to Experience', title: "New Arrivals", cta: 'Explore Now', image: u('1511707171634-5f897ff02aa9', 800) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On Orders Over 50,000' },
  { key: 'f2', title: 'Easy Returns', text: 'Hassle-Free Within 7 Days' },
  { key: 'f3', title: '24/7 Support', text: "We're Always Here" },
  { key: 'f4', title: 'Genuine Products', text: '100% Original & Trusted' },
];
