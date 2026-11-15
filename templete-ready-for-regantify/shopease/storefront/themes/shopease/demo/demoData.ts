// Sample data for the Shopease template demo page (/template-demo/shopease), taken from the template's lib/data.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices (dollars here,
// shown in taka by the demo). Nothing here reaches a real store.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

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
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 79.99, rating: 4.5, reviews: 120, image: u('1583394838336-acd977736f90'), isNew: true },
  { id: 2, name: 'Leather Handbag', category: 'Women', price: 59.99, rating: 4.5, reviews: 98, image: u('1548036328-c9fa89d128fa'), isNew: true },
  { id: 3, name: 'Classic Sneakers', category: 'Men', price: 49.99, oldPrice: 69.99, rating: 4.5, reviews: 156, image: u('1549298916-b41d501d3772') },
  { id: 4, name: 'Eau de Parfum', category: 'Beauty', price: 29.99, rating: 4.5, reviews: 87, image: u('1541643600914-78b084683601'), isNew: true },
  { id: 5, name: 'Floral Midi Dress', category: 'Women', price: 44.99, rating: 4.5, reviews: 76, image: u('1595777457583-95e059d581b8') },
  { id: 6, name: 'Oversized Denim Jacket', category: 'Women', price: 69.99, oldPrice: 89.99, rating: 4.5, reviews: 113, image: u('1551028719-00167b16eac5') },
  { id: 7, name: 'Cozy Knit Sweater', category: 'Women', price: 34.99, rating: 4.5, reviews: 64, image: u('1576871337622-98d48d1cf531') },
  { id: 8, name: 'Canvas Backpack', category: 'Men', price: 36.99, rating: 4.5, reviews: 188, image: u('1553062407-98eeb64c6a62') },
];

export const DEMO_CATEGORIES = [
  { name: 'Women', image: u('1515886657613-9f3515b0c78f') },
  { name: 'Men', image: u('1507003211169-0a1dd7228f2d') },
  { name: 'Home & Living', image: u('1586023492125-27b2c045efd7') },
  { name: 'Beauty', image: u('1556228720-195a672e8a03') },
  { name: 'Electronics', image: u('1505740420928-5e560c06d30e') },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1441986300917-64674bd600d8', 1800), eyebrow: 'Limited time only', title: ['Shop More,'], accent: 'Save More!', text: 'Discover amazing deals on your favorite products.' },
  { key: 's2', image: u('1445205170230-053b83016050', 1800), eyebrow: 'New season', title: ['Fresh Styles,'], accent: 'Just Landed.', text: 'Explore the latest arrivals, picked for you.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Deal of the Day', title: 'Grab It Before\nIt’s Gone!', cta: 'Shop the Deal', image: u('1546868871-7041f2a55e12', 1000) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳7,500' },
  { key: 'f2', title: 'Easy Returns', text: '30-day returns' },
  { key: 'f3', title: 'Premium Quality', text: '100% original products' },
  { key: 'f4', title: '24/7 Support', text: "We're here to help" },
];
