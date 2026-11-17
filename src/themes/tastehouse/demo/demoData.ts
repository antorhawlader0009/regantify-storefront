// Sample data for the Tastehouse template demo page (/template-demo/tastehouse), taken from the template's lib/data.ts and
// lib/images.ts. Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices
// in taka (the template's dollars x 120, to the nearest 10). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 10) * 10;

export interface DemoProduct {
  id: string;
  name: string;
  sub: string;
  /** Prices in taka. */
  price: number;
  oldPrice?: number;
  rating: number;
  image: string;
  badge?: { text: string; color: string };
}

const GREEN = '#3E8E3E';
const RED = '#E8472F';
const D = (id: string, name: string, sub: string, usd: number, rating: number, photo: string, badge?: { text: string; color: string }, oldUsd?: number): DemoProduct => ({
  id,
  name,
  sub,
  price: taka(usd),
  oldPrice: oldUsd ? taka(oldUsd) : undefined,
  rating,
  image: u(photo),
  badge,
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  D('d1', 'Grilled Chicken with Veggies', 'Healthy plate', 12.99, 4.8, 'photo-1532550907401-a500c9a57435', { text: 'Bestseller', color: GREEN }),
  D('d2', 'Margherita Pizza', 'Classic Delight', 10.99, 4.7, 'photo-1574071318508-1cdbab80d002', { text: '10% OFF', color: RED }, 12.2),
  D('d3', 'Paneer Butter Masala', 'with Naan', 11.49, 4.9, 'photo-1631452180519-c014fe946bc7', { text: 'Bestseller', color: GREEN }),
  D('d4', 'Sushi Platter', '12 Pieces', 13.99, 4.6, 'photo-1553621042-f6e147245754', { text: '10% OFF', color: RED }, 15.5),
  D('d5', 'Chocolate Lava Cake', 'with Ice Cream', 6.99, 4.8, 'photo-1624353365286-3f8d62daad51', { text: '20% OFF', color: RED }, 8.75),
  D('d6', 'Pepperoni Pizza', 'Extra Cheese', 12.49, 4.7, 'photo-1565299624946-b28f40a0ae38'),
  D('d7', 'Creamy Alfredo Pasta', 'Garlic Bread', 11.99, 4.5, 'photo-1621996346565-e3dbc646d9a9'),
  D('d8', 'Chicken Biryani', 'Dum Style', 13.49, 4.8, 'photo-1563379091339-03b21ab4a4f8', { text: '10% OFF', color: RED }, 14.99),
  D('d9', 'Street Tacos', '3 Pieces', 8.99, 4.6, 'photo-1565299585323-38d6b0865b47'),
  D('d10', 'Spicy Zinger Burger', 'Crispy chicken burger', 8.99, 4.7, 'photo-1568901346375-23c9450c58cd'),
];

export const DEMO_CATEGORIES = [
  { name: 'Italian', image: u('photo-1513104890138-7c749659a591', 400) },
  { name: 'Chinese', image: u('photo-1585032226651-759b368d7246', 400) },
  { name: 'Indian', image: u('photo-1585937421612-70a008356fbe', 400) },
  { name: 'Mexican', image: u('photo-1565299585323-38d6b0865b47', 400) },
  { name: 'Japanese', image: u('photo-1579871494447-9811cf80d66c', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1568901346375-23c9450c58cd', 1200), eyebrow: 'Good Food, Good Mood', title: ['Delicious Food'], accent: 'Delivered Fast.', text: 'Discover the best restaurants, cuisines and exclusive offers near you.' },
  { key: 's2', image: u('photo-1513104890138-7c749659a591', 1200), eyebrow: 'Good Food, Good Mood', title: ['Fresh Pizza'], accent: 'Straight From Oven.', text: 'Stone baked classics, made to order.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Limited Time Offer', title: 'Flat 30% OFF\nOn Your First Order!', cta: 'Order Now', image: u('photo-1546069901-ba9599a7e63c', 600) },
  { key: 'b', kicker: 'Weekend Special', title: 'Family Combo\nMeals', cta: 'Order Now', image: u('photo-1571091718767-18b5b1457add', 600) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Delivery', text: 'On orders over ৳2,400' },
  { key: 'f2', title: 'Easy Returns', text: '7-day return policy' },
  { key: 'f3', title: 'Secure Payment', text: '100% secure checkout' },
  { key: 'f4', title: '24/7 Support', text: "We're here to help" },
];
