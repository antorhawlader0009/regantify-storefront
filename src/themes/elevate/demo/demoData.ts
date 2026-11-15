// Sample data for the Elevate template demo page (/template-demo/elevate), taken from the template's lib/data.ts.
// Photos are real Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
const u = (id: string, w = 1000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export const IMG = {
  hero: u('1617137968427-85924c800a22', 1800),
  heroSummer: u('1507003211169-0a1dd7228f2d', 1800),
  heroSale: u('1519085360753-af0119f7cbe7', 1800),
  rack: u('1519085360753-af0119f7cbe7', 1400),
};

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
  { id: 1, name: 'Linen Shirt', category: 'Shirts', price: 59, rating: 4.6, reviews: 128, image: u('1596755094514-f87e34085b2c', 700) },
  { id: 2, name: 'Garment Dyed Tee', category: 'T-Shirts', price: 29, oldPrice: 39, rating: 4.7, reviews: 96, image: u('1583743814966-8936f5b7be1a', 700) },
  { id: 3, name: 'Overshirt Jacket', category: 'Jackets', price: 129, rating: 4.8, reviews: 214, image: u('1591047139829-d91aecb6caea', 700), isNew: true },
  { id: 4, name: 'Tailored Trousers', category: 'Pants', price: 79, oldPrice: 95, rating: 4.5, reviews: 87, image: u('1473966968600-fa801b869a1a', 700) },
  { id: 5, name: 'Court Sneakers', category: 'Shoes', price: 95, rating: 4.6, reviews: 241, image: u('1549298916-b41d501d3772', 700) },
  { id: 6, name: 'Weekender Bag', category: 'Accessories', price: 145, rating: 4.9, reviews: 112, image: u('1548036328-c9fa89d128fa', 700), isNew: true },
  { id: 7, name: 'Essential Crew Tee', category: 'T-Shirts', price: 25, rating: 4.4, reviews: 402, image: u('1521572163474-6864f9cf17ab', 700) },
  { id: 8, name: 'Leather Belt', category: 'Accessories', price: 49, oldPrice: 60, rating: 4.7, reviews: 156, image: u('1624222247344-550fb60583dc', 700) },
];

export const DEMO_CATEGORIES = [
  { name: 'Shirts', count: 120, image: u('1596755094514-f87e34085b2c', 500) },
  { name: 'T-Shirts', count: 150, image: u('1521572163474-6864f9cf17ab', 500) },
  { name: 'Jackets', count: 60, image: u('1591047139829-d91aecb6caea', 500) },
  { name: 'Pants', count: 80, image: u('1473966968600-fa801b869a1a', 500) },
  { name: 'Shoes', count: 100, image: u('1549298916-b41d501d3772', 500) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'new', eyebrow: 'New Season', title: ['Refined.', 'Modern.'], accent: 'Effortless.', text: 'Timeless pieces. Contemporary silhouettes. Made to elevate your everyday.', image: IMG.hero },
  { key: 'summer', eyebrow: 'Summer Linen Edit', title: ['Light. Breathable.'], accent: 'Effortless.', text: 'Linen shirts, tees and trousers for warm days.', image: IMG.heroSummer },
  { key: 'sale', eyebrow: 'Seasonal Recommendations', title: ['Spring / Summer'], accent: 'Collection', text: 'New fabrics. New tones. Same elevated standard.', image: IMG.heroSale },
];

export const DEMO_PROMOS = [{ key: 'sale', kicker: 'Seasonal', title: 'Spring / Summer\nCollection', cta: 'Explore Collection', image: IMG.rack }];
