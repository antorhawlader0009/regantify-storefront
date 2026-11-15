// Sample data for the Gadgetstore template demo page (/template-demo/gadgetstore), taken from the template's data/products.ts and
// data/images.ts. Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in
// taka (the template's dollars x 120, to the nearest 100). Nothing here reaches a real store.
const u = (id: string, w = 700) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=90&w=${w}`;
const taka = (usd: number) => Math.round((usd * 120) / 100) * 100;

export interface DemoProduct {
  id: string;
  name: string;
  /** Prices in taka. */
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
}

const P = (id: string, name: string, usd: number, rating: number, reviews: number, photo: string, oldUsd?: number): DemoProduct => ({
  id,
  name,
  price: taka(usd),
  oldPrice: oldUsd ? taka(oldUsd) : undefined,
  rating,
  reviews,
  image: u(photo),
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  P('p1', 'Apple AirPods Pro 2', 249, 5, 128, '1590658268037-6bf12165a8df'),
  P('p2', 'boAt Rockerz 450 Wireless Headphones', 59, 5, 96, '1546435770-a3e426bf472b', 79),
  P('p3', 'Apple Watch Series 9', 399, 5, 74, '1579586337278-3befd40fd17a'),
  P('p4', 'DJI Mini 3 Drone', 469, 5, 112, '1507582020474-9a35b7d455d9'),
  P('p5', 'JBL Flip 6 Speaker', 129, 5, 88, '1545454675-3531b543be5d'),
  P('p6', 'Sony WH-1000XM5 Headphones', 349, 5, 214, '1618366712010-f4ae9c647dcb', 399),
  P('p7', 'Samsung Galaxy Watch 6', 299, 4, 58, '1544117519-31a4b719223d', 349),
  P('p8', 'Apple iPhone 15 128GB', 799, 5, 341, '1592899677977-9c10ca588bbd'),
  P('p9', 'GoPro HERO12 Black', 349, 5, 137, '1526170375885-4d8ecf77b99f', 399),
  P('p10', 'PS5 DualSense Controller', 69, 5, 305, '1606144042614-b2417e99c4e3'),
];

export const DEMO_CATEGORIES = [
  { name: 'Audio', image: u('1583394838336-acd977736f90', 400) },
  { name: 'Wearables', image: u('1546868871-7041f2a55e12', 400) },
  { name: 'Mobiles & Tablets', image: u('1511707171634-5f897ff02aa9', 400) },
  { name: 'Drones & Cameras', image: u('1473968512647-3e447244af8f', 400) },
  { name: 'Gaming', image: u('1606144042614-b2417e99c4e3', 400) },
  { name: 'Smart Home', image: u('1558089687-f282ffcbc126', 400) },
  { name: 'Accessories', image: u('1583863788434-e58a36330cf0', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1505740420928-5e560c06d30e', 1400), eyebrow: 'SMART TECH, BETTER LIFE.', title: ['Latest Gadgets.'], accent: 'Endless Possibilities.', text: 'Explore cutting-edge gadgets that make life smarter, easier and more fun.' },
  { key: 's2', image: u('1523275335684-37898b6baf30', 1400), eyebrow: 'WEAR THE FUTURE.', title: ['Smart Watches.'], accent: 'Smarter Moments.', text: 'Track, connect and stay ahead with the newest wearables of the season.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'LIMITED TIME OFFER', title: 'UP TO 30% OFF', cta: 'SHOP THE DEALS', image: u('1583394838336-acd977736f90', 900) },
  { key: 'b', kicker: 'NEW ARRIVALS', title: 'Smarter Tech.\nBetter You.', cta: 'EXPLORE NOW', image: u('1511707171634-5f897ff02aa9', 900) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'FREE SHIPPING', text: 'On Orders Over ৳7,000' },
  { key: 'f2', title: 'SECURE PAYMENT', text: '100% Secure Checkout' },
  { key: 'f3', title: '1 YEAR WARRANTY', text: 'On All Products' },
  { key: 'f4', title: 'EASY RETURNS', text: '30-Day Hassle Free Returns' },
  { key: 'f5', title: '24/7 SUPPORT', text: 'Always Here To Help' },
];
