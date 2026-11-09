// Sample data for the Chronics template demo page (/template-demo/chronics), copied from the template's lib/data.ts and
// lib/images.ts. Photos are real Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMG = {
  hero: u('1625832954356-6ddaffc45853', 1200),
  hero2: u('1589136371962-abcdf83feb57', 1200),
  hero3: u('1612198270461-b86dd7a7256f', 1200),
  newArrival: u('1484342878342-14169ec7e3af', 1200),
};

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'V-Neck Summer Dress', category: "Women's Wear", brand: 'ZARA', price: 29.99, oldPrice: 39.99, rating: 4.5, reviews: 128, image: u('1589136371962-abcdf83feb57') },
  { id: 'p2', name: 'Off Shoulder Top', category: "Women's Top", brand: 'MANGO', price: 21.99, rating: 4, reviews: 96, image: u('1484342878342-14169ec7e3af') },
  { id: 'p3', name: 'Striped Casual Shirt', category: "Women's Top", brand: 'H&M', price: 27.99, oldPrice: 39.99, rating: 4.5, reviews: 150, image: u('1612198270461-b86dd7a7256f') },
  { id: 'p4', name: 'Denim Jacket', category: "Women's Wear", brand: "Levi's", price: 49.99, rating: 4, reviews: 76, image: u('1566917306266-652261b1ae5c') },
  { id: 'p5', name: 'Floral Wrap Dress', category: "Women's Wear", brand: 'ZARA', price: 31.99, oldPrice: 39.99, rating: 4.5, reviews: 89, image: u('1625832954356-6ddaffc45853') },
  { id: 'p6', name: 'Round Sunglasses', category: 'Sunglasses', brand: 'GUESS', price: 19.99, oldPrice: 24.99, rating: 4.5, reviews: 64, image: u('1685715481110-19db0a76de2f') },
  { id: 'p7', name: 'Pink Street Sneakers', category: 'Shoes', brand: 'NIKE', price: 54.99, rating: 5, reviews: 112, image: u('1488993497948-5e80ca852d9c') },
  { id: 'p8', name: 'Leather Tote Bag', category: 'Bags', brand: 'MANGO', price: 44.99, oldPrice: 59.99, rating: 4.5, reviews: 83, image: u('1595326995002-3c708e5caed7') },
  { id: 'p9', name: 'Pearl Necklace', category: 'Jewelry', brand: 'GUESS', price: 24.99, rating: 5, reviews: 57, image: u('1595345705177-ffe090eb0784') },
  { id: 'p10', name: 'Classic Graphic Tee', category: "Men's Wear", brand: 'adidas', price: 17.99, rating: 4, reviews: 71, image: u('1587568738882-a572cf4fd080') },
];

export const DEMO_CATEGORIES = [
  { name: 'New Arrival', image: u('1484342878342-14169ec7e3af', 400) },
  { name: 'Sunglasses', image: u('1685715481110-19db0a76de2f', 400) },
  { name: 'Shoes', image: u('1488993497948-5e80ca852d9c', 400) },
  { name: 'Big Offer', image: u('1589136371962-abcdf83feb57', 400) },
  { name: 'Bags', image: u('1595326995002-3c708e5caed7', 400) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'offer', eyebrow: 'Special Offer', title: ['Refresh Your'], accent: 'Fashion Vibe', text: 'Grab up to 40% OFF on your first order. Limited time only!', image: IMG.hero },
  { key: 'summer', eyebrow: 'Summer Edit', title: ['Bright Looks For'], accent: 'Sunny Days', text: 'Dresses, tops and sunglasses at friendly prices.', image: IMG.hero2 },
  { key: 'big', eyebrow: 'Big Offers', title: ['Style Up With'], accent: 'Up To 30% Off', text: 'Pick your favourites from our big offer collection.', image: IMG.hero3 },
];

export const DEMO_PROMOS = [{ key: 'new', kicker: 'New Collection', title: 'New Arrivals\nJust For You', cta: 'Shop Now', image: IMG.newArrival }];

export const DEMO_BRANDS = [
  { name: 'ZARA', count: 2 },
  { name: 'MANGO', count: 2 },
  { name: 'H&M', count: 1 },
  { name: "Levi's", count: 1 },
  { name: 'GUESS', count: 2 },
  { name: 'NIKE', count: 1 },
  { name: 'adidas', count: 1 },
];
