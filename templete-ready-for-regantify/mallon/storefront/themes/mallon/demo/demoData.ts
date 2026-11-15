// Sample data for the Mallon template demo page (/template-demo/mallon), taken from the template's lib/data.ts and lib/images.ts.
// Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices (dollars here,
// shown in taka by the demo). Nothing here reaches a real store.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface DemoProduct {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  isNew?: boolean;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 1, name: 'Vitamin C + Zinc effervescent tablets', price: 30, oldPrice: 35, image: u('1596177583101-26b7dada4f5c'), isNew: true },
  { id: 2, name: 'Pain relief tablets blister pack', price: 15, oldPrice: 19, image: u('1584308666744-24d5c474f2ae') },
  { id: 3, name: 'Vitamin B12 daily supplement', price: 22, oldPrice: 28, image: u('1704694671866-f83e0b91df09') },
  { id: 4, name: 'Digital stethoscope home kit', price: 85, oldPrice: 96, image: u('1505751172876-fa1923c5c528') },
  { id: 5, name: 'Infant milk powder 400g tin', price: 55, oldPrice: 65, image: u('1664216294580-079bc527ae49') },
  { id: 6, name: 'Digital blood pressure monitor', price: 72, oldPrice: 89, image: u('1576091160550-2173dba999ef') },
  { id: 7, name: 'Paracetamol 500mg tablets', price: 12, image: u('1664956617328-c2491040fa2c') },
  { id: 8, name: 'Omega-3 fish oil capsules 1000mg', price: 45, oldPrice: 55, image: u('1664956618021-73c47736845e') },
  { id: 9, name: 'Electric toothbrush sonic pro', price: 48, oldPrice: 60, image: u('1512069772995-ec65ed45afd6') },
  { id: 10, name: 'Antiseptic first aid kit', price: 35, oldPrice: 42, image: u('1576671081837-49000212a370') },
];

export const DEMO_CATEGORIES = [
  { name: 'Medicine', image: u('1584308666744-24d5c474f2ae', 300) },
  { name: 'Vitamins', image: u('1596177583101-26b7dada4f5c', 300) },
  { name: 'Baby Care', image: u('1519689680058-324335c77eba', 300) },
  { name: 'Personal Care', image: u('1556228720-195a672e8a03', 300) },
  { name: 'Devices', image: u('1505751172876-fa1923c5c528', 300) },
  { name: 'Oral Care', image: u('1512069772995-ec65ed45afd6', 300) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1583947215259-38e31be8751f', 1400), eyebrow: 'Get the complete', title: ['Hand Sanitiser'], accent: '', text: 'Kill 99.99% of germs fast.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Weekend sale', title: 'Face masks\nup to 50% off', cta: 'Shop Now', image: u('1584744982491-665216d95f8b', 700) },
  { key: 'b', kicker: 'Great deals', title: 'The Great\nBaby Deals', cta: 'Shop Now', image: u('1519689680058-324335c77eba', 700) },
  { key: 'c', kicker: 'Weekend sale', title: 'Cleansing\nessentials', cta: 'Shop Now', image: u('1584744646898-40ff0404e767', 700) },
];
