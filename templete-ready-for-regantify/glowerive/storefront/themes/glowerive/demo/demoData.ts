// Sample data for the Glowerive template demo page (/template-demo/glowerive), taken from the template's lib/data.ts.
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
  { id: 'p1', name: 'Hydra Glow Gel Cream', category: 'Moisturizers', price: 3400, image: u('1552046122-03184de85e08'), rating: 4.5, reviews: 245, badge: { text: 'Best Seller' } },
  { id: 'p2', name: 'Radiance Boost Serum', category: 'Serums', price: 4200, image: u('1608571423902-eed4a5ad8108'), rating: 4.5, reviews: 189, badge: { text: 'New' } },
  { id: 'p3', name: 'Nourishing Night Restorative Cream', category: 'Moisturizers', price: 3800, image: u('1585945037805-5fd82c2e60b1'), rating: 4.5, reviews: 312, badge: { text: 'Limited' } },
  { id: 'p4', name: 'Daily UV Defense Sunscreen SPF 50', category: 'Sun Care', price: 2400, oldPrice: 3000, image: u('1619451427882-6aaaded0cc61'), rating: 4.5, reviews: 156, badge: { text: 'Sale', sale: true } },
  { id: 'p5', name: 'Vitamin C Brightening Serum', category: 'Serums', price: 3900, image: u('1573461160327-b450ce3d8e7f'), rating: 4.5, reviews: 98 },
  { id: 'p6', name: 'Gentle Foaming Cleanser', category: 'Cleansers', price: 2200, image: u('1761718209708-9ab9ba1c7252'), rating: 4.5, reviews: 204 },
  { id: 'p7', name: 'Hyaluronic Hydration Serum', category: 'Serums', price: 4400, image: u('1620916297397-a4a5402a3c6c'), rating: 4.5, reviews: 131, badge: { text: 'New' } },
  { id: 'p8', name: 'Rose Petal Balancing Toner', category: 'Toners', price: 2600, image: u('1580870069867-74c57ee1bb07'), rating: 4.5, reviews: 87 },
];

export const DEMO_CATEGORIES = [
  { name: 'Serums', image: u('1608571423902-eed4a5ad8108', 400) },
  { name: 'Moisturizers', image: u('1552046122-03184de85e08', 400) },
  { name: 'Cleansers', image: u('1761718209708-9ab9ba1c7252', 400) },
  { name: 'Toners', image: u('1580870069867-74c57ee1bb07', 400) },
  { name: 'Eye Care', image: u('1648203276014-20f97ba1f817', 400) },
  { name: 'Sun Care', image: u('1619451427882-6aaaded0cc61', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1670201203116-26644750a726', 2400), eyebrow: 'Naturally Radiant', title: ['Skincare that cares,', 'beauty that shines.'], accent: '', text: 'Discover the perfect blend of nature and science for healthy, glowing skin every day.' },
];

export const DEMO_PROMOS = [
  { key: 'offer', kicker: 'Special offer', title: 'Get 20% Off\nYour First Order', cta: 'Shop Now', image: u('1580870069867-74c57ee1bb07', 900) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: '100% Natural', text: 'Clean, plant-based ingredients' },
  { key: 'f2', title: 'Deep Hydration', text: 'Moisture that lasts all day' },
  { key: 'f3', title: 'Dermatologist Tested', text: 'Gentle on every skin type' },
  { key: 'f4', title: 'Cruelty Free', text: 'Never tested on animals' },
];
