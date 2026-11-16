// Sample data for the Papernest template demo page (/template-demo/papernest), after the template's data/products.ts. The template
// takes its pictures from a keyword photo service; the demo uses Unsplash photos of the same kinds of things (free to use under the
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
  isNew?: boolean;
}

const P = (id: number, name: string, usd: number, rating: number, reviews: number, photo: string, isNew = false): DemoProduct => ({ id, name, price: taka(usd), rating, reviews, image: u(photo), isNew });

export const DEMO_PRODUCTS: DemoProduct[] = [
  P(1, 'Pastel Spiral Notebook', 12.99, 4.5, 124, '1531346878377-a5be20888e57', true),
  P(2, 'Gel Pen Set (12 Pcs)', 14.99, 5, 98, '1583485088034-697b5bc54ccd', true),
  P(3, 'Aesthetic Sticky Notes', 6.99, 4.5, 76, '1586075010923-2dd4570fb338', true),
  P(4, 'Desk Organizer', 18.99, 4.5, 53, '1456735190827-d1262f71b8a3', true),
  P(5, 'Watercolor Paint Set', 16.99, 4.6, 88, '1460661419201-fd4cecdf8a8b'),
  P(6, 'Daily Planner 2026', 11.99, 4.4, 142, '1506784365847-bbad939e9335'),
  P(7, 'School Backpack', 29.99, 4.7, 201, '1553062407-98eeb64c6a62'),
  P(8, 'Gift Stationery Bundle', 24.99, 4.8, 67, '1513885535751-8b9238bd345a'),
  P(9, 'Washi Tape Collection', 8.99, 4.5, 110, '1513364776144-60967b0f800f'),
  P(10, 'Highlighter Pastel Set', 7.99, 4.6, 95, '1455390582262-044cdead277a'),
  P(11, 'Mini Whiteboard', 13.99, 4.3, 41, '1503676260728-1c00da094a0b'),
  P(12, 'Leather Journal', 21.99, 4.7, 130, '1544816155-12df9643f363'),
];

export const DEMO_CATEGORIES = [
  { name: 'Notebooks & Journals', image: u('1531346878377-a5be20888e57', 200) },
  { name: 'Pens & Writing', image: u('1583485088034-697b5bc54ccd', 200) },
  { name: 'Art & Craft', image: u('1513364776144-60967b0f800f', 200) },
  { name: 'School Essentials', image: u('1553062407-98eeb64c6a62', 200) },
  { name: 'Office Supplies', image: u('1456735190827-d1262f71b8a3', 200) },
  { name: 'Planners & Organizers', image: u('1506784365847-bbad939e9335', 200) },
  { name: 'Stickers & Accessories', image: u('1586075010923-2dd4570fb338', 200) },
  { name: 'Gifts & Bundles', image: u('1513885535751-8b9238bd345a', 200) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1456735190827-d1262f71b8a3', 1400), eyebrow: 'A brighter you, every day', title: ['Small', 'Supplies'], accent: 'Big Ideas', text: 'Everything you need to make your ideas happen.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Colorful supplies for brighter minds.', title: 'Make Learning More Fun', cta: 'Shop School Essentials', image: u('1553062407-98eeb64c6a62', 800) },
  { key: 'b', kicker: 'Art supplies for every imagination.', title: 'Create Without Limits', cta: 'Shop Art & Craft', image: u('1460661419201-fd4cecdf8a8b', 800) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳6,000' },
  { key: 'f2', title: 'Easy Returns', text: '30-day hassle free returns' },
  { key: 'f3', title: 'Secure Payment', text: '100% safe checkout' },
  { key: 'f4', title: 'Happy Customers', text: 'Loved by 50,000+ students' },
];
