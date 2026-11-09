// Sample data for the Chicwove template demo page (/template-demo/chicwove), copied from the template's lib/data.ts.
// Photos are real Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
const u = (id: string, w = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export const IMG = {
  hero: u('photo-1515886657613-9f3515b0c78f', 1600),
  heroSummer: u('photo-1496747611176-843222e1e57c', 1600),
  heroSale: u('photo-1483985988355-763728e1935b', 1600),
  rack: u('photo-1490481651871-ab68de25d43d', 1400),
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
  { id: 1, name: 'Cropped Blazer', category: 'Tops & T-shirts', price: 59, rating: 4.6, reviews: 128, image: u('photo-1487222477894-8943e31ef7b2', 700) },
  { id: 2, name: 'Floral Midi Skirt', category: 'Women Dresses', price: 45, oldPrice: 60, rating: 4.7, reviews: 96, image: u('photo-1485968579580-b6d095142e6e', 700) },
  { id: 3, name: 'Classic Denim Jacket', category: 'Denim Wear', price: 69, rating: 4.8, reviews: 214, image: u('photo-1551537482-f2075a1d41f2', 700), isNew: true },
  { id: 4, name: 'High-Rise Mom Jeans', category: 'Denim Wear', price: 55, oldPrice: 70, rating: 4.5, reviews: 187, image: u('photo-1542272604-787c3835535d', 700) },
  { id: 5, name: 'White Everyday Sneakers', category: 'Shoes & Footwear', price: 65, rating: 4.6, reviews: 241, image: u('photo-1549298916-b41d501d3772', 700) },
  { id: 6, name: 'Leather Tote Bag', category: 'Bags & Accessories', price: 85, rating: 4.9, reviews: 312, image: u('photo-1548036328-c9fa89d128fa', 700), isNew: true },
  { id: 7, name: 'Basic Cotton Tee', category: 'Tops & T-shirts', price: 19, rating: 4.4, reviews: 402, image: u('photo-1521572163474-6864f9cf17ab', 700) },
  { id: 8, name: 'Wrap Summer Dress', category: 'Women Dresses', price: 52, oldPrice: 65, rating: 4.7, reviews: 156, image: u('photo-1496747611176-843222e1e57c', 700) },
];

export const DEMO_CATEGORIES = [
  { name: 'Women Dresses', count: 120, image: u('photo-1496747611176-843222e1e57c', 500) },
  { name: 'Tops & T-shirts', count: 150, image: u('photo-1529139574466-a303027c1d8b', 500) },
  { name: 'Denim Wear', count: 80, image: u('photo-1542272604-787c3835535d', 500) },
  { name: 'Shoes & Footwear', count: 100, image: u('photo-1549298916-b41d501d3772', 500) },
  { name: 'Bags & Accessories', count: 90, image: u('photo-1548036328-c9fa89d128fa', 500) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'new', eyebrow: 'New Collection', title: ['Stylish Looks.'], accent: 'Everyday You.', text: 'Trendy styles, premium quality & unmatched comfort.', image: IMG.hero },
  { key: 'summer', eyebrow: 'Summer Edit', title: ['Bright Looks For'], accent: 'Sunny Days', text: 'Dresses, tops and accessories at friendly prices.', image: IMG.heroSummer },
  { key: 'sale', eyebrow: 'Limited Time Offer', title: ['Up To 30% Off'], accent: "Women's Fashion", text: 'Grab your favourite styles before the deal ends.', image: IMG.heroSale },
];

export const DEMO_PROMOS = [{ key: 'sale', kicker: 'Limited Time Offer', title: "Up To 30% OFF\nOn Selected Women's Fashion", cta: 'Grab the Deal', image: IMG.rack }];
