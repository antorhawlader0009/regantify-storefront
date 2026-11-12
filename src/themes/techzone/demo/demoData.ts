// Sample data for the TechZone template demo page (/template-demo/techzone): a made-up electronics shop. The photos are the
// template's own Unsplash photos (free to use under the Unsplash License); the prices are sample prices in taka. Nothing here
// reaches a real store.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroPhone: u('1511707171634-5f897ff02aa9', 2000),
  heroPs5: u('1606144042614-b2417e99c4e3', 2000),
  heroWatch: u('1546868871-7041f2a55e12', 2000),
  promoGaming: u('1606144042614-b2417e99c4e3', 1000),
  promoPhone: u('1511707171634-5f897ff02aa9', 1000),
};

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
  badge?: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'iPhone 15 Pro', category: 'Smartphones', price: 124999, oldPrice: 149999, image: u('1592286927505-1def25115558'), rating: 4.5, reviews: 124, badge: '-17%' },
  { id: 'p2', name: 'MacBook Air M2', category: 'Laptops', price: 119000, oldPrice: 135000, image: u('1517336714731-489689fd1ca8'), rating: 4.5, reviews: 99, badge: '-12%' },
  { id: 'p3', name: 'AirPods Pro (2nd Gen)', category: 'Audio', price: 27500, image: u('1572569511254-d8f925fe2cbb'), rating: 4.5, reviews: 76, badge: 'New' },
  { id: 'p4', name: 'Galaxy Watch 6', category: 'Smartwatches', price: 33900, oldPrice: 44900, image: u('1546868871-7041f2a55e12'), rating: 4.5, reviews: 64, badge: '-25%' },
  { id: 'p5', name: 'DualSense Controller', category: 'Gaming', price: 8200, oldPrice: 9200, image: u('1606144042614-b2417e99c4e3'), rating: 4.5, reviews: 52, badge: '-11%' },
  { id: 'p6', name: 'JBL Flip 6', category: 'Audio', price: 14900, oldPrice: 18500, image: u('1608043152269-423dbba4e7e1'), rating: 4.5, reviews: 41, badge: '-19%' },
  { id: 'p7', name: 'Sony WH-1000XM5', category: 'Audio', price: 38900, oldPrice: 46900, image: u('1583394838336-acd977736f90'), rating: 5, reviews: 88, badge: '-17%' },
  { id: 'p8', name: 'Smart Home Speaker', category: 'Smart Home', price: 11900, image: u('1558002038-1055907df827'), rating: 4, reviews: 37, badge: 'New' },
  { id: 'p9', name: 'Galaxy S24', category: 'Smartphones', price: 94999, oldPrice: 104999, image: u('1610945415295-d9bbf067e59c'), rating: 4.5, reviews: 70, badge: '-10%' },
  { id: 'p10', name: 'Dell XPS 13', category: 'Laptops', price: 129000, oldPrice: 149000, image: u('1593642632823-8f785ba67e45'), rating: 4.5, reviews: 58, badge: '-13%' },
  { id: 'p11', name: 'Apple Watch Series 9', category: 'Smartwatches', price: 47900, image: u('1434493789847-2f02dc6ca35d'), rating: 5, reviews: 93, badge: 'New' },
  { id: 'p12', name: 'PlayStation 5 Console', category: 'Gaming', price: 62900, image: u('1606813907291-d86efa9b94db'), rating: 5, reviews: 210 },
];

export const DEMO_CATEGORIES = [
  { name: 'Smartphones', image: u('1511707171634-5f897ff02aa9', 500) },
  { name: 'Laptops', image: u('1496181133206-80ce9b88a853', 500) },
  { name: 'Audio', image: u('1505740420928-5e560c06d30e', 500) },
  { name: 'Smartwatches', image: u('1546868871-7041f2a55e12', 500) },
  { name: 'Gaming', image: u('1606144042614-b2417e99c4e3', 500) },
  { name: 'Smart Home', image: u('1558002038-1055907df827', 500) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'phones', image: IMG.heroPhone, eyebrow: 'NEW ARRIVAL', title: ['Meet the Latest'], accent: 'Smartphones', text: 'Stay connected with powerful performance, stunning displays and all-day battery life.' },
  { key: 'gaming', image: IMG.heroPs5, eyebrow: 'BEST DEAL', title: ['Next Level'], accent: 'Gaming', text: 'Experience the future of gaming with consoles, controllers and accessories.' },
  { key: 'watch', image: IMG.heroWatch, eyebrow: 'TRENDING', title: ['Stay Connected'], accent: 'On Your Wrist', text: 'Track fitness, answer calls and stay on top of your day with the newest smartwatches.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Gaming', title: 'Next Level Gaming', cta: 'Shop now', image: IMG.promoGaming },
  { key: 'b', kicker: 'Smartphones', title: 'Latest Smartphones', cta: 'Shop now', image: IMG.promoPhone },
];

export const DEMO_BRANDS = [
  { name: 'Apple', count: 4 },
  { name: 'Samsung', count: 3 },
  { name: 'JBL', count: 2 },
  { name: 'Sony', count: 2 },
  { name: 'Asus', count: 2 },
  { name: 'Xiaomi', count: 2 },
];

export const DEMO_REVIEWS = [
  { id: 'r1', name: 'Ahmed B.', rating: 5, content: 'Amazing products and fast shipping! Highly recommended!' },
  { id: 'r2', name: 'Sara K.', rating: 5, content: 'Great quality and excellent customer service. I will definitely order again.' },
  { id: 'r3', name: 'Yassine M.', rating: 5, content: 'The website is easy to use and the products are original. Very satisfied!' },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Free Shipping', text: 'On orders over ৳5,000' },
  { key: 'f2', title: 'Genuine Products', text: '100% Original' },
  { key: 'f3', title: '24/7 Support', text: "We're here to help" },
  { key: 'f4', title: 'Secure Payment', text: 'Multiple options' },
];
