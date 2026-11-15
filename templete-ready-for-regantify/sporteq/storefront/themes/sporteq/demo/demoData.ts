// Sample data for the Sporteq template demo page (/template-demo/sporteq), taken from the template's data/products.ts and
// data/images.ts. Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices
// in taka (the template's dollars x 120, to the nearest 10). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;
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
  P(1, 'Nike Mercurial Vapor 15 Football Boots', 129.99, 4.5, 1245, '1511886929837-354d827aae26'),
  P(2, 'Wilson NBA Authentic Indoor/Outdoor Basketball', 59.99, 4.5, 982, '1519861531473-9200262188bf'),
  P(3, 'SG Sunny Gold 5000 Cricket Bat', 89.99, 4.4, 1112, '1540747913346-19e32dc3e97e'),
  P(4, 'Yonex Astrox 99 Play Badminton Racket', 79.99, 4.6, 873, '1626224583764-f87db24ac4ea'),
  P(5, 'Adidas Unisex Gym Bag (Medium)', 39.99, 4.3, 653, '1547949003-9792a18a2601'),
  P(6, 'FitPro Resistance Bands Set (5 Levels)', 24.99, 4.4, 521, '1517838277536-f5f99be501cd'),
  P(7, 'IronCore Hex Dumbbell Pair (10 kg)', 69.99, 4.7, 440, '1517836357463-d25dfeac3438'),
  P(8, 'SportEQ Insulated Water Bottle 750ml', 19.99, 4.5, 318, '1602143407151-7111542de6e8'),
  P(9, 'Nike Pegasus 40 Running Shoes', 119.99, 4.8, 2031, '1542291026-7eec264c27ff'),
  P(10, 'ZenFlow Non-Slip Yoga Mat 6mm', 29.99, 4.5, 933, '1544367567-0f2fcb009e0b'),
];

export const DEMO_CATEGORIES = [
  { name: 'Football', image: u('1614632537423-1e6c2e7e0aab', 300) },
  { name: 'Basketball', image: u('1546519638-68e109498ffc', 300) },
  { name: 'Running', image: u('1542291026-7eec264c27ff', 300) },
  { name: 'Fitness', image: u('1534438327276-14e5300c3a48', 300) },
  { name: 'Cricket', image: u('1531415074968-036ba1b575da', 300) },
  { name: 'Tennis', image: u('1622279457486-62dcc4a431d6', 300) },
  { name: 'Outdoor', image: u('1553062407-98eeb64c6a62', 300) },
  { name: 'Accessories', image: u('1586350977771-b3b0abd50c82', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1517649763962-0c623066013b', 2000), eyebrow: 'PERFORMANCE. QUALITY. PASSION.', title: ['GEAR UP.'], accent: 'PLAY HARD.', text: 'Top-quality sports equipment for every athlete, every game.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Limited Time Offer', title: 'Up to 20% Off', cta: 'Shop the Deals', image: u('1517963879433-6ad2b056d712', 1200) },
  { key: 'b', kicker: 'New Arrivals', title: 'New Gear.\nBetter Performance.', cta: 'Explore Now', image: u('1542291026-7eec264c27ff', 1200) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On Orders Over ৳12,000' },
  { key: 'f2', title: 'Secure Payment', text: '100% Safe & Secure' },
  { key: 'f3', title: 'Premium Quality', text: 'Built to Perform' },
  { key: 'f4', title: 'Easy Returns', text: '30-Day Hassle Free Returns' },
];
