// Sample data for the Greenmart template demo page (/template-demo/greenmart), taken from the template's lib/data.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka
// (the template's dollars x 120, to the nearest 5). Nothing here reaches a real store.
const u = (id: string, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const taka = (usd: number) => Math.round((usd * 120) / 5) * 5;

export interface DemoProduct {
  id: string;
  name: string;
  unit: string;
  /** Prices in taka. */
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  isNew?: boolean;
}

const P = (id: string, name: string, unit: string, photo: string, usd: number, oldUsd?: number, isNew?: boolean): DemoProduct => ({
  id,
  name,
  unit,
  price: taka(usd),
  oldPrice: oldUsd ? taka(oldUsd) : undefined,
  rating: 4.5,
  reviews: 40 + Math.round(usd * 11),
  image: u(photo),
  isNew,
});

export const DEMO_PRODUCTS: DemoProduct[] = [
  P('broccoli', 'Fresh Broccoli', '1 head', 'photo-1459411621453-7b03977f4bfc', 2.54, 2.99),
  P('apples', 'Red Apples', '1 lb', 'photo-1560806887-1e4cd0b6cbd6', 2.39, 2.99),
  P('spinach', 'Baby Spinach', '5 oz bunch', 'photo-1576045057995-568f588f82fb', 1.79, 1.99),
  P('strawberries', 'Strawberries', '1 pint', 'photo-1464965911861-746a04b4bca6', 3.99, undefined, true),
  P('mango', 'Ripe Mango', 'each', 'photo-1553279768-865429fa0078', 1.99, undefined, true),
  P('eggs', 'Farm Fresh Eggs', '12 count', 'photo-1582722872445-44dc5f7e3c8f', 3.49, undefined, true),
  P('carrots', 'Organic Carrots', '1 lb bunch', 'photo-1598170845058-32b9d6a5da37', 1.29, undefined, true),
  P('milk', 'Whole Milk', '1 gallon', 'photo-1550583724-b2692b85b150', 2.89),
];

export const DEMO_CATEGORIES = [
  { name: 'Fruits', image: u('photo-1610832958506-aa56368176cf', 400) },
  { name: 'Vegetables', image: u('photo-1540420773420-3366772f4999', 400) },
  { name: 'Dairy & Eggs', image: u('photo-1550583724-b2692b85b150', 400) },
  { name: 'Beverages', image: u('photo-1600271886742-f049cd451bba', 400) },
  { name: 'Pantry Staples', image: u('photo-1586201375761-83865001e31c', 400) },
  { name: 'Snacks', image: u('photo-1621939514649-280e2ee25f60', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('photo-1542838132-92c53300491e', 2000), eyebrow: 'Fresh picks, just for you', title: ['Groceries that'], accent: 'feel good', text: 'Fresh fruits, vegetables, and essentials delivered to your door.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Limited time', title: 'Fresh Deals', cta: 'Shop Deals', image: u('photo-1610832958506-aa56368176cf', 800) },
  { key: 'b', kicker: 'Free delivery', title: 'Stock up\nand save more!', cta: 'Start shopping', image: u('photo-1542838132-92c53300491e', 800) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Sourced Fresh Daily', text: 'From local farms & trusted suppliers' },
  { key: 'f2', title: 'Eco-Friendly', text: 'Sustainable packaging & responsible choices' },
  { key: 'f3', title: 'Easy Returns', text: 'Hassle-free returns within 24 hours' },
  { key: 'f4', title: '24/7 Support', text: 'We are here to help anytime' },
];
