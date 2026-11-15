// Sample data for the Belora template demo page (/template-demo/belora), taken from the template's data/products.ts and images.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices (dollars here,
// shown in taka by the demo). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

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
  { id: 1, name: 'Glow Face Serum', category: 'Skin Care', price: 29.99, rating: 4.9, reviews: 128, image: u('1713768704571-6aeb0d0e5105') },
  { id: 2, name: 'Hydrating Moisturizer', category: 'Skin Care', price: 24.99, rating: 4.8, reviews: 96, image: u('1613803745799-ba6c10aace85') },
  { id: 3, name: 'Radiance Face Wash', category: 'Skin Care', price: 18.99, rating: 4.7, reviews: 74, image: u('1616750819456-5cdee9b85d22') },
  { id: 4, name: 'Matte Lipstick', category: 'Makeup', price: 16.99, rating: 4.8, reviews: 112, image: u('1587313512268-a3b47aa30166') },
  { id: 5, name: 'Rose Water Toner', category: 'Skin Care', price: 19.99, oldPrice: 24.99, rating: 4.6, reviews: 58, image: u('1734077522356-d100054f28bc') },
  { id: 6, name: 'Sun Shield SPF 50+', category: 'Skin Care', price: 22.99, rating: 4.9, reviews: 87, image: u('1620916566398-39f1143ab7be'), isNew: true },
  { id: 7, name: 'Midnight Repair Elixir', category: 'Skin Care', price: 34.99, rating: 4.8, reviews: 41, image: u('1671493235081-5842463637cd') },
  { id: 8, name: 'Velvet Lip Tint', category: 'Makeup', price: 14.99, oldPrice: 18.99, rating: 4.5, reviews: 65, image: u('1773372238324-e9cffa5f45b7') },
  { id: 9, name: 'Lavender Hair Mask', category: 'Hair Care', price: 21.99, rating: 4.7, reviews: 52, image: u('1583209814683-c023dd293cc6'), isNew: true },
  { id: 10, name: 'Lavender Body Butter', category: 'Bath & Body', price: 19.99, rating: 4.8, reviews: 77, image: u('1612817288484-6f916006741a') },
];

export const DEMO_CATEGORIES = [
  { name: 'Skin Care', count: 24, image: u('1713768704571-6aeb0d0e5105', 300) },
  { name: 'Makeup', count: 18, image: u('1587313512268-a3b47aa30166', 300) },
  { name: 'Hair Care', count: 12, image: u('1583209814683-c023dd293cc6', 300) },
  { name: 'Bath & Body', count: 10, image: u('1612817288484-6f916006741a', 300) },
  { name: 'Fragrances', count: 8, image: u('1665763630810-e6251bdd392d', 300) },
  { name: 'Gift Sets', count: 6, image: u('1598440947619-2c35fc9aa908', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'new', eyebrow: 'Natural beauty, radiant you', title: ['Pure Ingredients,', 'Powerful Results'], accent: '', text: 'Discover clean, effective and cruelty-free cosmetics for every skin type.', image: u('1580870069867-74c57ee1bb07', 1200) },
];

export const DEMO_PROMOS = [
  { key: 'selfcare', kicker: "Self care isn't selfish", title: 'Indulge in Everyday\nSelf Care', cta: 'Discover More', image: u('1629198688000-71f23e745b6e', 1400) },
];
