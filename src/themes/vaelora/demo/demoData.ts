// Sample data for the Vaelora template demo page (/template-demo/vaelora): a made-up watch shop. The photos are the template's own
// Unsplash photos (free to use under the Unsplash License); the prices are sample prices in taka. Nothing here reaches a real
// store.
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=85&w=${w}`;

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
  badge?: string;
}

const P = [
  u('photo-1533139502658-0198f920d8e8', 700),
  u('photo-1612817159949-195b6eb9e31a', 700),
  u('photo-1539874754764-5a96559165b0', 700),
  u('photo-1594534475808-b18fc33b045e', 700),
  u('photo-1617043786394-f977fa12eddf', 700),
  u('photo-1526045431048-f857369baa09', 700),
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'Elite Chronograph', category: 'Vaelora', price: 185000, image: P[0], rating: 5, reviews: 24 },
  { id: 'p2', name: 'Heritage Automatic', category: 'Vaelora', price: 142000, image: P[1], rating: 5, reviews: 18 },
  { id: 'p3', name: 'Noir Dress Watch', category: 'Dress', price: 98000, oldPrice: 112000, image: P[2], rating: 4.5, reviews: 31, badge: 'Offer' },
  { id: 'p4', name: 'Atlas Diver 300', category: 'Sport', price: 125000, image: P[3], rating: 4.5, reviews: 15 },
  { id: 'p5', name: 'Aurora Moonphase', category: 'Women', price: 156000, image: P[4], rating: 5, reviews: 12, badge: 'New' },
  { id: 'p6', name: 'Meridian Slim', category: 'Dress', price: 88000, image: P[5], rating: 4.5, reviews: 27 },
  { id: 'p7', name: 'Pilot Field 40', category: 'Sport', price: 79000, image: P[0], rating: 4.5, reviews: 19 },
  { id: 'p8', name: 'Orbit Smart Hybrid', category: 'Smart', price: 64000, image: P[1], rating: 4, reviews: 22 },
];

export const DEMO_CATEGORIES = [
  { name: 'Men', image: u('photo-1587836374828-4dbafa94cf0e') },
  { name: 'Women', image: u('photo-1542496658-e33a6d0d50f6') },
  { name: 'Sport', image: u('photo-1548171915-e79a380a2a4b') },
  { name: 'Dress', image: u('photo-1434056886845-dac89ffe9b56') },
];

export const DEMO_HERO_SLIDES = [
  { key: 'h1', image: u('photo-1523170335258-f5ed11844a49', 1800), eyebrow: 'New collection', title: ['Precision.'], accent: 'Crafted for time.', text: 'Where timeless design meets modern performance.' },
  { key: 'h2', image: u('photo-1524592094714-0f0654e20314', 1800), eyebrow: 'Signature', title: ['Quiet.'], accent: 'By design.', text: 'Balanced proportions and considered materials.' },
  { key: 'h3', image: u('photo-1547996160-81dfa63595aa', 1800), eyebrow: 'Maison selection', title: ['Made to'], accent: 'last.', text: 'Finished by hand, inspected twice.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Limited edition', title: 'Built in limited numbers.', cta: 'Discover now', image: u('photo-1522312346375-d1a52e2b99b3', 1200) },
  { key: 'b', kicker: 'Private circle', title: 'Early access. Private viewings.', cta: 'Request an invitation', image: u('photo-1523170335258-f5ed11844a49', 1200) },
];

export const DEMO_BRANDS = [{ name: 'Vaelora' }, { name: 'Maison Nord' }, { name: 'Aurel' }, { name: 'Halden' }];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Certified authentic', text: 'Every watch ships with its certificate and original papers.' },
  { key: 'f2', title: '2-year warranty', text: 'International coverage and dedicated after-sales care.' },
  { key: 'f3', title: 'Insured shipping', text: 'Complimentary, fully insured delivery on every order.' },
  { key: 'f4', title: 'Gift packaging', text: 'Presented in our signature box, complimentary.' },
];

export const DEMO_REVIEWS = [
  { id: 'r1', name: 'Imran K.', rating: 5, content: 'Understated and beautifully finished. It gets compliments every week.' },
  { id: 'r2', name: 'Sadia R.', rating: 5, content: 'Packaging, papers and service were faultless.' },
  { id: 'r3', name: 'Mehedi T.', rating: 5, content: 'A watch I will keep for decades.' },
];
