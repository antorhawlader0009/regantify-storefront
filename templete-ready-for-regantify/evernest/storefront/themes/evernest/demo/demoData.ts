// Sample data for the Evernest template demo page (/template-demo/evernest), after the template's data/properties.ts and
// data/images.ts. Photos are the template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices
// in taka. Nothing here reaches a real store.
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export interface DemoProduct {
  id: string;
  name: string;
  location: string;
  /** Price in taka, already formatted. */
  price: string;
  image: string;
  /** Beds, baths and area, as the template shows them. */
  meta: string;
  status: 'For Sale' | 'For Rent';
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p1', name: 'Garden Family Home', location: 'Savar, Dhaka', price: '৳ 2,95,00,000', image: u('1600596542815-ffad4c1539a9'), meta: '4 Beds · 3 Baths · 2,600 sqft', status: 'For Sale' },
  { id: 'p2', name: 'Green View Apartment', location: 'Purbachal, Dhaka', price: '৳ 55,000 / month', image: u('1545324418-cc1a3fa10c00'), meta: '3 Beds · 2 Baths · 1,500 sqft', status: 'For Rent' },
  { id: 'p3', name: 'Lakeside Eco Villa', location: 'Gazipur', price: '৳ 6,80,00,000', image: u('1512917774080-9991f1c4c750'), meta: '5 Beds · 4 Baths · 4,400 sqft', status: 'For Sale' },
  { id: 'p4', name: 'Solar Powered Duplex', location: 'Bashundhara R/A, Dhaka', price: '৳ 4,10,00,000', image: u('1600607687939-ce8a6c25118c'), meta: '4 Beds · 4 Baths · 3,100 sqft', status: 'For Sale' },
  { id: 'p5', name: 'Treehouse Studio', location: 'Sylhet', price: '৳ 38,000 / month', image: u('1493809842364-78817add7ffb'), meta: '1 Bed · 1 Bath · 700 sqft', status: 'For Rent' },
  { id: 'p6', name: 'Green Office Space', location: 'Gulshan, Dhaka', price: '৳ 1,80,000 / month', image: u('1486406146926-c627a92ad1ab'), meta: '2,000 sqft', status: 'For Rent' },
];

export const DEMO_CATEGORIES = [
  { name: 'Houses', image: u('1600596542815-ffad4c1539a9', 700) },
  { name: 'Apartments', image: u('1545324418-cc1a3fa10c00', 700) },
  { name: 'Villas', image: u('1512917774080-9991f1c4c750', 700) },
  { name: 'Commercial', image: u('1486406146926-c627a92ad1ab', 700) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1441974231531-c6227db76b6e', 2400), eyebrow: 'Green living', title: ['Find'], accent: 'Eco-Friendly', text: 'Discover sustainable, nature-surrounded homes made for peaceful and healthy living.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Welcome to Evernest', title: 'We help you live\ncloser to nature', cta: 'Explore More', image: u('1449844908441-8829872d2607', 1000) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Verified Listings', text: '100% Genuine Properties' },
  { key: 'f2', title: 'Expert Guidance', text: 'From Start to Finish' },
  { key: 'f3', title: 'Best Locations', text: 'Prime Areas Only' },
  { key: 'f4', title: 'After-Sales Support', text: "We're Always Here" },
];
