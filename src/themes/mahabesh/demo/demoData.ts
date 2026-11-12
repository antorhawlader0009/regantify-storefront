// Sample data for the Mahabesh template demo page (/template-demo/mahabesh): a made-up home and kitchen shop. The photos are
// Unsplash photos (free to use under the Unsplash License, the same ones the Furnilux template uses); the prices are
// sample prices in taka. Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMG = {
  hero1: u('1586023492125-27b2c045efd7', 2000),
  hero2: u('1617806118233-18e1de247200', 2000),
  hero3: u('1555041469-a586c61ea9bc', 2000),
};

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  /** Price in taka. */
  price: number;
  oldPrice?: number;
  image: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'Wooden Dining Table', category: 'Dining', price: 24900, oldPrice: 29900, image: u('1617806118233-18e1de247200') },
  { id: 'p2', name: 'Oak Dining Chair Set', category: 'Dining', price: 15900, image: u('1592078615290-033ee584e267') },
  { id: 'p3', name: 'Round Coffee Table', category: 'Living', price: 9900, oldPrice: 12900, image: u('1533090481720-856c6e3c1fdc') },
  { id: 'p4', name: 'Ceramic Table Vase', category: 'Decor', price: 1450, image: u('1578500494198-246f612d3b3d') },
  { id: 'p5', name: 'Woven Floor Rug', category: 'Decor', price: 6900, oldPrice: 8500, image: u('1600166898405-da9535204843') },
  { id: 'p6', name: 'Brass Table Lamp', category: 'Lighting', price: 3200, image: u('1507473885765-e6ed057f782c') },
  { id: 'p7', name: 'Round Wall Mirror', category: 'Decor', price: 4800, oldPrice: 5900, image: u('1560448204-e02f11c3d0e2') },
  { id: 'p8', name: 'Velvet Bar Stool', category: 'Dining', price: 5400, image: u('1503602642458-232111445657') },
  { id: 'p9', name: 'Modern Bookshelf', category: 'Living', price: 11900, image: u('1594620302200-9a762244a156') },
  { id: 'p10', name: 'Framed Wall Art', category: 'Decor', price: 2600, oldPrice: 3200, image: u('1513519245088-0e12902e5a38') },
];

export const DEMO_CATEGORIES = [
  { name: 'Dining', image: u('1617806118233-18e1de247200', 500) },
  { name: 'Living', image: u('1555041469-a586c61ea9bc', 500) },
  { name: 'Decor', image: u('1578500494198-246f612d3b3d', 500) },
  { name: 'Lighting', image: u('1507473885765-e6ed057f782c', 500) },
  { name: 'Rugs', image: u('1600166898405-da9535204843', 500) },
  { name: 'Storage', image: u('1594620302200-9a762244a156', 500) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'home', image: IMG.hero1, title: ['Make your home feel like you'] },
  { key: 'dining', image: IMG.hero2, title: ['Dining and kitchen picks'] },
  { key: 'living', image: IMG.hero3, title: ['Living room, sorted'] },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'This week', title: 'Dining room offers', cta: 'Shop now', image: u('1617806118233-18e1de247200', 900) },
  { key: 'b', kicker: 'New in', title: 'Lamps and light', cta: 'Shop now', image: u('1507473885765-e6ed057f782c', 900) },
];

export const DEMO_BRANDS = [
  { name: 'Hearth', count: 4 },
  { name: 'Oakline', count: 3 },
  { name: 'Brassa', count: 2 },
];
