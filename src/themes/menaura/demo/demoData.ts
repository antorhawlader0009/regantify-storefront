// Sample data for the Menaura template demo page (/template-demo/menaura), taken from the template's lib/data.ts and images.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
const u = (id: string, w = 900) => `https://unsplash.com/photos/${id}/download?force=true&w=${w}`;
const P = { grayBlazer: 'bqvsORpHMeM', beigeHoodie: 'eeH5rlmIS4g', blackSuit: 'Uw3OfKz2J-0', brownCoat: '2cmLR_I_hn0', brownJacket: '1qsGJD4BF7I' };

export const IMG = {
  hero: u(P.grayBlazer, 1800),
  heroB: u(P.brownCoat, 1800),
  heroC: u(P.beigeHoodie, 1800),
  promo: u(P.brownCoat, 1800),
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
  { id: 1, name: 'Beige Bomber Jacket', category: 'Casual Wear', price: 149, rating: 5, reviews: 128, image: u(P.beigeHoodie) },
  { id: 2, name: 'Smart Casual Blazer', category: 'Formal Wear', price: 199, rating: 4.5, reviews: 96, image: u(P.grayBlazer) },
  { id: 3, name: 'Knitted Polo Shirt', category: 'Casual Wear', price: 79, oldPrice: 99, rating: 4.5, reviews: 74, image: u(P.brownJacket) },
  { id: 4, name: 'Classic Overshirt', category: 'Street Style', price: 89, oldPrice: 119, rating: 4, reviews: 58, image: u(P.brownCoat) },
  { id: 5, name: 'Textured Wool Coat', category: 'Outerwear', price: 229, rating: 5, reviews: 41, image: u(P.blackSuit), isNew: true },
  { id: 6, name: 'Urban Field Jacket', category: 'Outerwear', price: 169, rating: 4.5, reviews: 33, image: u(P.brownJacket), isNew: true },
  { id: 7, name: 'Relaxed Linen Shirt', category: 'Casual Wear', price: 69, rating: 4.5, reviews: 52, image: u(P.beigeHoodie) },
  { id: 8, name: 'Everyday Cotton Tee', category: 'Casual Wear', price: 39, rating: 4, reviews: 210, image: u(P.brownJacket), isNew: true },
];

export const DEMO_CATEGORIES = [
  { name: 'Casual Wear', count: 12, image: u(P.beigeHoodie) },
  { name: 'Formal Wear', count: 9, image: u(P.grayBlazer) },
  { name: 'Street Style', count: 8, image: u(P.brownJacket) },
  { name: 'Outerwear', count: 8, image: u(P.brownCoat) },
  { name: 'Accessories', count: 7, image: u(P.blackSuit) },
];

export const DEMO_HERO_SLIDES = [
  { key: 'new', eyebrow: 'New Collection', title: ['Define'], accent: 'Your Style', text: 'Modern Menswear for Every Occasion', image: IMG.hero },
  { key: 'autumn', eyebrow: 'Autumn Edit', title: ['Warm Layers'], accent: 'Made To Last', text: 'Coats, overshirts and knits in earthy tones.', image: IMG.heroB },
  { key: 'casual', eyebrow: 'Everyday Casual', title: ['Easy Pieces'], accent: 'Every Day', text: 'Relaxed fits and soft fabrics.', image: IMG.heroC },
];

export const DEMO_PROMOS = [{ key: 'sale', kicker: 'Limited Time Offer', title: 'Autumn Collection\nUp to 30% OFF', cta: 'Shop Collection', image: IMG.promo }];
