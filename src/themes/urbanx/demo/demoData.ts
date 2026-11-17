// Sample data for the Urbanx template demo page (/template-demo/urbanx), taken from the template's lib/data.ts and images.ts.
// The photos are the template's own Unsplash photos (free to use under the Unsplash License); the prices are sample prices in taka.
// Nothing here reaches a real store.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

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
  { id: 'p1', name: 'CHAOS TEE - BLACK', category: 'T-Shirts', price: 4900, image: u('1576566588028-4147f3842f27'), rating: 4.5, reviews: 128, badge: { text: 'New' } },
  { id: 'p2', name: 'WASHED HOODIE - CHARCOAL', category: 'Hoodies', price: 8900, image: u('1620799140408-edc6dcb6d633'), rating: 4.5, reviews: 96, badge: { text: 'New' } },
  { id: 'p3', name: 'UTILITY CARGO PANTS - BLACK', category: 'Pants', price: 9900, image: u('1624378439575-d8705ad7ae80'), rating: 5, reviews: 74, badge: { text: 'New' } },
  { id: 'p4', name: 'SKETCH TEE - SAND', category: 'T-Shirts', price: 4500, image: u('1503342217505-b0a15ec3261c'), rating: 4, reviews: 58, badge: { text: 'New' } },
  { id: 'p5', name: 'URBANX CAP - BLACK', category: 'Accessories', price: 4500, image: u('1588850561407-ed78c282e89b'), rating: 4.5, reviews: 43, badge: { text: 'New' } },
  { id: 'p6', name: 'SOCIETY HOODIE - OLIVE', category: 'Hoodies', price: 8900, image: u('1578768079052-aa76e52ff62e'), rating: 4.5, reviews: 61, badge: { text: 'New' } },
  { id: 'p7', name: 'RIOT JACKET - BLACK', category: 'Jackets', price: 12900, oldPrice: 15900, image: u('1551028719-00167b16eac5'), rating: 5, reviews: 39, badge: { text: '-19%', sale: true } },
  { id: 'p8', name: 'VANDAL TEE - WHITE', category: 'T-Shirts', price: 3900, oldPrice: 5500, image: u('1521572163474-6864f9cf17ab'), rating: 4, reviews: 82, badge: { text: '-29%', sale: true } },
  { id: 'p9', name: 'STREET HOODIE - GREY', category: 'Hoodies', price: 6900, oldPrice: 9500, image: u('1556821840-3a63f95609a7'), rating: 4.5, reviews: 77, badge: { text: '-27%', sale: true } },
  { id: 'p10', name: 'TACTICAL JOGGERS - OLIVE', category: 'Pants', price: 6500, oldPrice: 8900, image: u('1473966968600-fa801b869a1a'), rating: 4, reviews: 54, badge: { text: '-27%', sale: true } },
];

export const DEMO_CATEGORIES = [
  { name: 'HOODIES', image: u('1556821840-3a63f95609a7') },
  { name: 'T-SHIRTS', image: u('1503342217505-b0a15ec3261c') },
  { name: 'PANTS', image: u('1624378439575-d8705ad7ae80') },
  { name: 'JACKETS', image: u('1551028719-00167b16eac5') },
  { name: 'ACCESSORIES', image: u('1588850561407-ed78c282e89b') },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1529139574466-a303027c1d8b', 2000), eyebrow: 'New Collection', title: ['Built different.'], accent: 'Made to stand out.', text: 'Premium streetwear for those who set their own rules.' },
  { key: 's2', image: u('1552374196-1ab2a1c593e8', 2000), eyebrow: 'Utility Line', title: ['Deep pockets.'], accent: 'Built to move.', text: 'Functional cuts for the city.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Join the movement', title: 'Be part of something real.', cta: 'Shop Now', image: u('1552374196-1ab2a1c593e8', 1200) },
  { key: 'b', kicker: 'Limited drop', title: 'Exclusive styles. Limited quantities.', cta: 'Explore Now', image: u('1618354691373-d851c5c3a990', 1200) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'FREE SHIPPING', text: 'On orders over ৳10,000' },
  { key: 'f2', title: 'EASY RETURNS', text: '30-day returns' },
  { key: 'f3', title: 'SECURE PAYMENT', text: '100% secure checkout' },
  { key: 'f4', title: 'CUSTOMER SUPPORT', text: '24/7 support' },
];
