// Sample data for the Solevo template demo page (/template-demo/solevo), copied from templete/solevo/lib/data.ts.
// Photos are real Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
const u = (id: string, w = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export const IMG = {
  hero: u('photo-1608231387042-66d1773070a5', 1800),
  heroWomen: u('photo-1543163521-1bf539c55dd2', 1800),
  heroSport: u('photo-1460353581641-37baddab0fa2', 1800),
  men: u('photo-1542291026-7eec264c27ff', 400),
  women: u('photo-1543163521-1bf539c55dd2', 400),
  kids: u('photo-1514989940723-e8e51635b782', 400),
  sports: u('photo-1460353581641-37baddab0fa2', 400),
  boots: u('photo-1520639888713-7851133b1ed0', 400),
  accessories: u('photo-1548036328-c9fa89d128fa', 400),
  banner1: u('photo-1539185441755-769473a23570', 900),
  banner2: u('photo-1515955656352-a1fa3ffcd111', 900),
  banner3: u('photo-1556906781-9a412961c28c', 900),
};

export interface DemoProduct {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  isNew?: boolean;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 1, name: 'Classic Court Sneakers', category: "Men's Shoes", brand: 'Adidas', price: 79.99, rating: 4.5, reviews: 320, image: u('photo-1549298916-b41d501d3772', 700) },
  { id: 2, name: 'Flex Runner Pro', category: "Men's Running Shoes", brand: 'Nike', price: 89.99, oldPrice: 109.99, rating: 4.5, reviews: 215, image: u('photo-1491553895911-0055eca6402d', 700) },
  { id: 3, name: 'Elegance Pointed Heels', category: "Women's Heels", brand: 'Puma', price: 69.99, oldPrice: 99.99, rating: 4.5, reviews: 182, image: u('photo-1543163521-1bf539c55dd2', 700) },
  { id: 4, name: 'Urban Casuals', category: "Men's Casual Shoes", brand: 'Vans', price: 74.99, rating: 4.5, reviews: 298, image: u('photo-1560769629-975ec94e6a86', 700), isNew: true },
  { id: 5, name: 'Kids Air Max', category: "Kids' Shoes", brand: 'Nike', price: 49.99, rating: 4.5, reviews: 156, image: u('photo-1514989940723-e8e51635b782', 700) },
  { id: 6, name: 'Cloud Walker', category: "Women's Sneakers", brand: 'Skechers', price: 84.99, oldPrice: 99.99, rating: 4.5, reviews: 241, image: u('photo-1595950653106-6c9ebd614d3a', 700) },
  { id: 7, name: 'Street Edge High', category: "Men's Sneakers", brand: 'Converse', price: 94.99, rating: 4.5, reviews: 187, image: u('photo-1606107557195-0e29a4b5b4aa', 700), isNew: true },
  { id: 8, name: 'Canvas Low Top', category: 'Unisex Shoes', brand: 'Converse', price: 54.99, rating: 4.5, reviews: 402, image: u('photo-1525966222134-fcfa99b8ae77', 700) },
  { id: 9, name: 'Velocity Trainer', category: "Men's Training Shoes", brand: 'New Balance', price: 99.99, oldPrice: 119.99, rating: 4.5, reviews: 133, image: u('photo-1600185365926-3a2ce3cdb9eb', 700) },
  { id: 10, name: 'Sprint Max', category: 'Sports Shoes', brand: 'Puma', price: 109.99, oldPrice: 139.99, rating: 4.5, reviews: 96, image: u('photo-1542291026-7eec264c27ff', 700) },
];

export const DEMO_CATEGORIES = [
  { name: 'Men', image: IMG.men },
  { name: 'Women', image: IMG.women },
  { name: 'Kids', image: IMG.kids },
  { name: 'Sports', image: IMG.sports },
  { name: 'Boots', image: IMG.boots },
  { name: 'Accessories', image: IMG.accessories },
];

export const DEMO_HERO_SLIDES = [
  { key: 'new', eyebrow: 'New Collection', title: ['Step Into', 'Style'], accent: 'Own Every Step', text: 'Discover premium shoes designed for comfort, crafted for style, made for you.', image: IMG.hero },
  { key: 'women', eyebrow: "Women's Edit", title: ['Elegance In', 'Every Step'], accent: 'Made To Move', text: 'From statement heels to cloud-soft sneakers, find the pair that moves with you.', image: IMG.heroWomen },
  { key: 'sale', eyebrow: 'Limited Time', title: ['Mid-Season', 'Sale'], accent: 'Up To 29% Off', text: 'Premium styles at friendlier prices. Grab your favourites before they are gone.', image: IMG.heroSport },
];

export const DEMO_PROMOS = [
  { key: 'men', kicker: "Men's Collection", title: 'Built for Comfort.\nStyled for You.', cta: 'Shop Men', image: IMG.banner1 },
  { key: 'women', kicker: "Women's Collection", title: 'Elegance in\nEvery Step.', cta: 'Shop Women', image: IMG.banner2 },
  { key: 'sale', kicker: 'Sale up to 29% off', title: "Don't Miss Out on\nExclusive Deals!", cta: 'Shop Sale', image: IMG.banner3 },
];

export const DEMO_BRANDS = [
  { name: 'Nike', count: 2 },
  { name: 'Adidas', count: 1 },
  { name: 'Puma', count: 2 },
  { name: 'Skechers', count: 1 },
  { name: 'Converse', count: 2 },
  { name: 'New Balance', count: 1 },
  { name: 'Vans', count: 1 },
];
