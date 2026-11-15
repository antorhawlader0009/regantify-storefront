// Sample data for the Minimog template demo page (/template-demo/minimog), taken from the template's lib/data.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices (dollars here,
// shown in taka by the demo). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export interface DemoProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  isNew?: boolean;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 1, name: 'Urban Backpack', category: 'Bags', price: 59, oldPrice: 79, rating: 4.5, reviews: 128, image: u('1553062407-98eeb64c6a62') },
  { id: 2, name: 'Minimal White Sneakers', category: 'Footwear', price: 79, rating: 4.5, reviews: 96, image: u('1595950653106-6c9ebd614d3a') },
  { id: 3, name: 'Classic Brown Watch', category: 'Watches', price: 129, rating: 4.5, reviews: 64, image: u('1524592094714-0f0654e20314'), isNew: true },
  { id: 4, name: 'Polarized Sunglasses', category: 'Accessories', price: 49, rating: 4.5, reviews: 82, image: u('1572635196237-14b3f281503f') },
  { id: 5, name: 'Hydrating Face Serum', category: 'Beauty & Care', price: 24, oldPrice: 34, rating: 4.5, reviews: 45, image: u('1556228720-195a672e8a03') },
  { id: 6, name: 'Slim Fit Denim Jeans', category: "Men's Fashion", price: 69, oldPrice: 89, rating: 4.4, reviews: 74, image: u('1542272604-787c3835535d') },
  { id: 7, name: 'Olive Utility Jacket', category: "Men's Fashion", price: 119, rating: 4.7, reviews: 58, image: u('1591047139829-d91aecb6caea'), isNew: true },
  { id: 8, name: 'Leather Tote Bag', category: 'Bags', price: 139, oldPrice: 169, rating: 4.6, reviews: 87, image: u('1584917865442-de89df76afd3') },
  { id: 9, name: 'Running Sneakers', category: 'Footwear', price: 109, rating: 4.7, reviews: 143, image: u('1542291026-7eec264c27ff'), isNew: true },
  { id: 10, name: 'Wireless Headphones', category: 'Accessories', price: 89, rating: 4.6, reviews: 166, image: u('1505740420928-5e560c06d30e'), isNew: true },
];

export const DEMO_CATEGORIES = [
  { name: "Men's Fashion", image: u('1591047139829-d91aecb6caea', 600) },
  { name: "Women's Fashion", image: u('1584917865442-de89df76afd3', 600) },
  { name: 'Footwear', image: u('1560343090-f0409e92791a', 600) },
  { name: 'Watches', image: u('1523275335684-37898b6baf30', 600) },
  { name: 'Bags', image: u('1553062407-98eeb64c6a62', 600) },
  { name: 'Accessories', image: u('1511499767150-a48a237f0083', 600) },
  { name: 'Home & Living', image: u('1485955900006-10f4d324d411', 600) },
  { name: 'Beauty & Care', image: u('1608248543803-ba4f8c70ae0b', 600) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1553062407-98eeb64c6a62', 1800), eyebrow: 'New collection', title: ['Elevate Your Lifestyle'], accent: 'with Premium Products', text: 'Discover carefully curated products designed for quality, style, and everyday comfort.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'LIMITED TIME OFFER', title: 'Spring Sale\nIs Live!', cta: 'Shop the Sale', image: u('1523381210434-271e8be1f52b', 1200) },
  { key: 'b', kicker: 'New season', title: "Men's Collection", cta: 'Shop', image: u('1507003211169-0a1dd7228f2d', 1000) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Fast & Free Shipping', text: 'On orders over ৳5,000' },
  { key: 'f2', title: '30-Day Money Back', text: 'No questions asked' },
  { key: 'f3', title: 'Secure Checkout', text: 'Your data is protected' },
  { key: 'f4', title: 'Friendly Support', text: "We're here to help" },
];
