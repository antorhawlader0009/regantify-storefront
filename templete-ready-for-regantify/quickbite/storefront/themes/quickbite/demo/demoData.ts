// Sample data for the Quickbite template demo page (/template-demo/quickbite), taken from the template's data/data.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka
// (the template's dollars x 120, to the nearest 10). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 10) * 10;

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  desc: string;
  /** Prices in taka. */
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
}

const P = (id: string, name: string, category: string, desc: string, usd: number, rating: number, reviews: number, photo: string, oldUsd?: number): DemoProduct => ({
  id,
  name,
  category,
  desc,
  price: taka(usd),
  oldPrice: oldUsd ? taka(oldUsd) : undefined,
  rating,
  reviews,
  image: u(photo),
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  P('d1', 'Classic Cheeseburger', 'Burgers', 'Juicy beef patty, cheddar, fresh lettuce', 8.99, 4.6, 2300, '1568901346375-23c9450c58cd'),
  P('d2', 'Pepperoni Pizza', 'Pizza', 'Stone-baked, mozzarella & spicy pepperoni', 12.99, 4.5, 1800, '1513104890138-7c749659a591', 14.99),
  P('d3', 'Salmon Sushi Set', 'Sushi', '8 pieces of fresh salmon nigiri & rolls', 14.5, 4.7, 1200, '1579871494447-9811cf80d66c'),
  P('d4', 'Crispy Fried Chicken', 'Burgers', 'Golden, crunchy chicken bucket with dip', 15.99, 4.4, 1900, '1626645738196-c2a7c87a8f58'),
  P('d5', 'Double Beef Burger', 'Burgers', 'Two smashed patties, double cheese, special sauce', 11.49, 4.8, 1450, '1571091718767-18b5b1457add', 13.49),
  P('d6', 'Margherita Pizza', 'Pizza', 'Tomato, fresh mozzarella and basil', 11.49, 4.6, 980, '1565299624946-b28f40a0ae38'),
  P('d7', 'Dragon Roll', 'Sushi', 'Eel, avocado and cucumber with sweet glaze', 13.99, 4.6, 640, '1579584425555-c3ce17fd4351'),
  P('d8', 'Chocolate Fudge Cake', 'Desserts', 'Rich, moist layers of dark chocolate', 5.99, 4.8, 860, '1578985545062-69928b1d9587'),
];

export const DEMO_CATEGORIES = [
  { name: 'Burgers', image: u('1568901346375-23c9450c58cd', 400) },
  { name: 'Pizza', image: u('1565299624946-b28f40a0ae38', 400) },
  { name: 'Sushi', image: u('1579584425555-c3ce17fd4351', 400) },
  { name: 'Salads', image: u('1512621776951-a57141f2eefd', 400) },
  { name: 'Desserts', image: u('1587668178277-295251f900ce', 400) },
  { name: 'Drinks', image: u('1622483767028-3f66f32aef97', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1550547660-d9450f859349', 1200), eyebrow: 'Food delivery', title: ['Good Food', 'Delivered', 'To Your Door'], text: 'Discover your favorite meals from our delicious menu. Fast, fresh and always on time.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Fresh & Organic', title: 'Healthy Choices\nDelivered', cta: 'Order Healthy', image: u('1512621776951-a57141f2eefd', 1600) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Fast Delivery', text: 'Get your food in 30 minutes or less.' },
  { key: 'f2', title: 'Secure Payment', text: '100% secure transactions.' },
  { key: 'f3', title: '24/7 Support', text: "We're here to help anytime." },
  { key: 'f4', title: 'Fresh Ingredients', text: 'Quality meals made from fresh ingredients.' },
];
