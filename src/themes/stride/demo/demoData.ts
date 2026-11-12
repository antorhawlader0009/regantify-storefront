// Sample data for the Stride template demo page (/template-demo/stride): a made-up sneaker shop. The photos are the template's own
// Unsplash photos (free to use under the Unsplash License); the prices are sample prices in taka. Nothing here reaches a real
// store.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

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
  { id: 'p1', name: "Nike Air Force 1 '07", category: 'Men', price: 13500, image: u('1595950653106-6c9ebd614d3a'), rating: 4.5, reviews: 128 },
  { id: 'p2', name: 'New Balance 530', category: 'Women', price: 14900, image: u('1539185441755-769473a23570'), rating: 4.5, reviews: 96 },
  { id: 'p3', name: 'Jordan 4 Retro', category: 'Men', price: 25900, image: u('1608231387042-66d1773070a5'), rating: 5, reviews: 210 },
  { id: 'p4', name: 'Adidas Campus 00s', category: 'Men', price: 12500, image: u('1556906781-9a412961c28c'), rating: 4.5, reviews: 74 },
  { id: 'p5', name: 'Converse Chuck 70 Hi', category: 'Women', price: 11900, image: u('1525966222134-fcfa99b8ae77'), rating: 4, reviews: 58 },
  { id: 'p6', name: 'Nike Dunk Low', category: 'Men', price: 14200, image: u('1579338559194-a162d19bf842'), rating: 4.5, reviews: 143 },
  { id: 'p7', name: 'Nike Air Zoom Pegasus', category: 'Running', price: 15900, image: u('1542291026-7eec264c27ff'), rating: 4.5, reviews: 64, badge: { text: 'New' } },
  { id: 'p8', name: 'Adidas Ultraboost Light', category: 'Running', price: 23500, image: u('1549298916-b41d501d3772'), rating: 5, reviews: 91, badge: { text: 'New' } },
  { id: 'p9', name: 'Nike Free RN Flyknit', category: 'Running', price: 18500, oldPrice: 22400, image: u('1460353581641-37baddab0fa2'), rating: 4.5, reviews: 52, badge: { text: 'Sale', sale: true } },
  { id: 'p10', name: 'Puma Suede Classic', category: 'Casual', price: 9900, oldPrice: 12500, image: u('1600185365926-3a2ce3cdb9eb'), rating: 4, reviews: 37, badge: { text: 'Sale', sale: true } },
];

export const DEMO_CATEGORIES = [
  { name: 'Men', image: u('1600185365926-3a2ce3cdb9eb') },
  { name: 'Women', image: u('1543508282-6319a3e2621f') },
  { name: 'Kids', image: u('1514989940723-e8e51635b782') },
  { name: 'Running', image: u('1460353581641-37baddab0fa2') },
  { name: 'Casual', image: u('1525966222134-fcfa99b8ae77') },
  { name: 'Slides', image: u('1562183241-b937e95585b6') },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1542291026-7eec264c27ff', 1600), eyebrow: 'Limited Collection', title: ['Designed to', 'Perform.'], accent: 'Built to Inspire.', text: 'Step into style. Elevate your game. Discover sneakers that move with you.' },
  { key: 's2', image: u('1549298916-b41d501d3772', 1600), eyebrow: 'New In', title: ['Run', 'Further.'], accent: 'Feel Lighter.', text: 'Responsive cushioning for every mile.' },
  { key: 's3', image: u('1460353581641-37baddab0fa2', 1600), eyebrow: 'Street Ready', title: ['Urban', 'Pace.'], accent: 'All Day Comfort.', text: 'Everyday sneakers with a sharp edge.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Limited drops', title: 'The Heat Is Real', cta: 'Shop Limited Drops', image: u('1597045566677-8cf032ed6634', 1200) },
  { key: 'b', kicker: 'Join Stride Club', title: 'Get Rewards. Early Access.', cta: 'Join Now', image: u('1491553895911-0055eca6402d', 1200) },
];

export const DEMO_BRANDS = [
  { name: 'Nike', count: 4 },
  { name: 'Adidas', count: 3 },
  { name: 'Jordan', count: 2 },
  { name: 'Puma', count: 2 },
  { name: 'Converse', count: 1 },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳10,000' },
  { key: 'f2', title: 'Easy Returns', text: '7-day hassle free returns' },
  { key: 'f3', title: 'Secure Payment', text: '100% secure checkout' },
  { key: 'f4', title: 'Customer Support', text: "We're here to help" },
];

export const DEMO_REVIEWS = [
  { id: 'r1', name: 'Rafi A.', rating: 5, content: 'Perfect fit and super comfortable. Arrived in two days.' },
  { id: 'r2', name: 'Nila S.', rating: 5, content: 'Exactly as pictured. Great quality for the price.' },
  { id: 'r3', name: 'Tanvir H.', rating: 4, content: 'Love the design, sizing runs a little small.' },
];
