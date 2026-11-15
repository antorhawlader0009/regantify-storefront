// Sample data for the Drivecraft template demo page (/template-demo/drivecraft), taken from the template's data/content.ts and
// data/images.ts. The photos are the template's own Unsplash photos (free to use under the Unsplash License); the prices are
// sample prices in taka. Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

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
  { id: 'p1', name: 'Complete Car Care Kit (15 Pieces)', category: 'Care & Detailing', price: 7700, oldPrice: 9900, image: u('photo-1520340356584-f9917d1eea6f', 700), rating: 4.9, reviews: 1248, badge: { text: 'BESTSELLER' } },
  { id: 'p2', name: 'Backseat Organizer with Tablet Holder', category: 'Comfort & Interior', price: 3800, oldPrice: 5400, image: u('photo-1507136566006-cfc505b114fc', 700), rating: 4.8, reviews: 732 },
  { id: 'p3', name: '360° Dash Cam Front & Rear', category: 'Electronics', price: 14300, oldPrice: 18600, image: u('photo-1558618666-fcd25c85cd64', 700), rating: 4.7, reviews: 668 },
  { id: 'p4', name: 'Full-Face Riding Helmet (DOT Certified)', category: 'Riding Gear', price: 8800, oldPrice: 12000, image: u('photo-1558980664-10e7170b5df9', 700), rating: 4.8, reviews: 934, badge: { text: 'BESTSELLER' } },
  { id: 'p5', name: 'Waterproof Handlebar Phone Mount', category: 'Electronics', price: 2700, oldPrice: 3800, image: u('photo-1568772585407-9361f9bf3a87', 700), rating: 4.7, reviews: 812 },
  { id: 'p6', name: 'Scooter Windproof Leg Cover', category: 'Comfort & Interior', price: 3300, oldPrice: 4400, image: u('photo-1591637333184-19aa84b3e01f', 700), rating: 4.6, reviews: 305, badge: { text: 'NEW' } },
  { id: 'p7', name: 'Premium Microfiber Wash Mitt (2 Pack)', category: 'Care & Detailing', price: 1900, oldPrice: 2700, image: u('photo-1599256621730-535171e28e50', 700), rating: 4.9, reviews: 912 },
  { id: 'p8', name: 'Tire Shine Gel High Gloss Finish', category: 'Care & Detailing', price: 1600, oldPrice: 2200, image: u('photo-1619405399517-d7fce0f13302', 700), rating: 4.8, reviews: 406 },
  { id: 'p9', name: 'Center Console Organiser Tray', category: 'Comfort & Interior', price: 2500, oldPrice: 3200, image: u('photo-1494976388531-d1058494cdd8', 700), rating: 4.7, reviews: 221 },
  { id: 'p10', name: 'Portable Jump Starter 2000A', category: 'Garage', price: 9900, oldPrice: 13200, image: u('photo-1486262715619-67b85e0b08d3', 700), rating: 4.8, reviews: 702, badge: { text: 'HOT' } },
  { id: 'p11', name: 'Rooftop Cargo Carrier Box', category: 'Exterior', price: 20900, oldPrice: 26400, image: u('photo-1492144534655-ae79c964c9d7', 700), rating: 4.7, reviews: 142 },
  { id: 'p12', name: 'Recovery Tow Strap Kit', category: 'Riding Gear', price: 4300, oldPrice: 5500, image: u('photo-1469854523086-cc02fe5d8800', 700), rating: 4.7, reviews: 211 },
];

export const DEMO_CATEGORIES = [
  { name: 'Care & Detailing', image: u('photo-1601362840469-51e4d8d58785') },
  { name: 'Comfort & Interior', image: u('photo-1503376780353-7e6692767b70') },
  { name: 'Exterior & Protection', image: u('photo-1492144534655-ae79c964c9d7') },
  { name: 'Electronics & Lighting', image: u('photo-1489824904134-891ab64532f1') },
  { name: 'Garage & Tools', image: u('photo-1486262715619-67b85e0b08d3') },
  { name: 'Riding Gear & Travel', image: u('photo-1568772585407-9361f9bf3a87') },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1533473359331-0135ef1b58bf', 2200), eyebrow: 'New Season', title: ['Gear Up.'], accent: 'Drive Proud.', text: 'Premium accessories, riding gear and care essentials for every journey. Built tough. Made to last.' },
  { key: 's2', image: u('photo-1558981403-c5f9899a28bc', 2200), eyebrow: 'Riders', title: ['Ride Safe.'], accent: 'Ride Far.', text: 'Helmets, mounts and gear for bikes and scooters.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Road trip ready', title: 'Bundles that save more.', cta: 'Shop Bundles', image: u('photo-1449965408869-eaa3f722e40d', 1200) },
  { key: 'b', kicker: 'Limited offer', title: 'Detailing kits. Up to 30% off.', cta: 'Shop Now', image: u('photo-1583121274602-3e2820c69888', 1200) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'FREE SHIPPING', text: 'On orders over ৳10,000' },
  { key: 'f2', title: 'EASY RETURNS', text: '30-day returns' },
  { key: 'f3', title: 'SECURE PAYMENT', text: '100% secure checkout' },
  { key: 'f4', title: 'EXPERT SUPPORT', text: "We're here to help" },
];
