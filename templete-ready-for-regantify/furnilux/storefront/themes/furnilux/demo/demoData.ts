// Sample data for the Furnilux template demo page (/template-demo/furnilux), taken from the template's data/products.ts and
// data/images.ts. Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample
// prices in taka. Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export interface DemoProduct {
  id: number;
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
  { id: 1, name: 'Modern 3-Seater Fabric Sofa', category: 'Living Room', price: 54900, oldPrice: 64900, image: u('1555041469-a586c61ea9bc'), rating: 4.5, reviews: 128, badge: { text: 'SALE', sale: true } },
  { id: 2, name: 'Solid Wood Dining Table Set', category: 'Dining Room', price: 78900, image: u('1617806118233-18e1de247200'), rating: 4.5, reviews: 86, badge: { text: 'NEW' } },
  { id: 3, name: 'Comfort Lounge Chair', category: 'Outdoor', price: 24900, image: u('1519947486511-46149fa0a254'), rating: 4, reviews: 54 },
  { id: 4, name: 'Upholstered Platform Bed', category: 'Bedroom', price: 69900, oldPrice: 82900, image: u('1505693416388-ac5ce068fe85'), rating: 4.5, reviews: 97, badge: { text: 'SALE', sale: true } },
  { id: 5, name: 'Round Oak Coffee Table', category: 'Living Room', price: 18900, image: u('1533090481720-856c6e3c1fdc'), rating: 4.5, reviews: 63 },
  { id: 6, name: 'Open Bookshelf with 5 Shelves', category: 'Living Room', price: 21900, image: u('1594620302200-9a762244a156'), rating: 4, reviews: 41 },
  { id: 7, name: 'Velvet Accent Armchair', category: 'Living Room', price: 28900, image: u('1567538096630-e0c55bd6374c'), rating: 4.5, reviews: 72, badge: { text: 'NEW' } },
  { id: 8, name: 'Ergonomic Office Chair', category: 'Office', price: 17900, oldPrice: 21900, image: u('1589384267710-7a170981ca78'), rating: 4.5, reviews: 118, badge: { text: 'SALE', sale: true } },
];

export const DEMO_CATEGORIES = [
  { name: 'Living Room', image: u('1555041469-a586c61ea9bc', 1000) },
  { name: 'Bedroom', image: u('1505693416388-ac5ce068fe85', 1000) },
  { name: 'Dining Room', image: u('1617806118233-18e1de247200', 1000) },
  { name: 'Office', image: u('1524758631624-e2822e304c36', 600) },
  { name: 'Outdoor', image: u('1519947486511-46149fa0a254', 600) },
  { name: 'Decor', image: u('1485955900006-10f4d324d411', 600) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1586023492125-27b2c045efd7', 2000), eyebrow: 'Timeless design, endless comfort', title: ['Furniture that'], accent: 'elevates your everyday', text: 'Premium furniture crafted for beautiful spaces and better living.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'This season', title: 'Refresh every room\nwith up to 30% off', cta: 'Shop the Sale', image: u('1493663284031-b7e3aefcae8e', 900) },
];

export const DEMO_BRANDS = [
  { name: 'NORDIC', count: 24 },
  { name: 'COMFORT', count: 18 },
  { name: 'WOODEN', count: 12 },
  { name: 'LUXORA', count: 9 },
  { name: 'MINIMAL', count: 15 },
  { name: 'LIVSPACE', count: 7 },
];
