// Sample data for the Estatepro template demo page (/template-demo/estatepro), after the template's lib/data.ts. Photos are the
// template's own Unsplash photos (free to use under the Unsplash License); prices are sample prices in taka. Nothing here reaches
// a real store.
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
  { id: 'p1', name: 'Modern Family Home', location: 'Gulshan 2, Dhaka', price: '৳ 3,85,00,000', image: u('1600596542815-ffad4c1539a9'), meta: '4 Beds · 3 Baths · 2,800 sqft', status: 'For Sale' },
  { id: 'p2', name: 'Skyline Apartment', location: 'Banani, Dhaka', price: '৳ 85,000 / month', image: u('1545324418-cc1a3fa10c00'), meta: '3 Beds · 2 Baths · 1,650 sqft', status: 'For Rent' },
  { id: 'p3', name: 'Luxury Villa with Pool', location: 'Bashundhara R/A, Dhaka', price: '৳ 9,20,00,000', image: u('1512917774080-9991f1c4c750'), meta: '5 Beds · 5 Baths · 5,200 sqft', status: 'For Sale' },
  { id: 'p4', name: 'Premium Corner Duplex', location: 'Dhanmondi, Dhaka', price: '৳ 5,40,00,000', image: u('1600607687939-ce8a6c25118c'), meta: '4 Beds · 4 Baths · 3,400 sqft', status: 'For Sale' },
  { id: 'p5', name: 'City Loft Studio', location: 'Uttara, Dhaka', price: '৳ 45,000 / month', image: u('1493809842364-78817add7ffb'), meta: '1 Bed · 1 Bath · 780 sqft', status: 'For Rent' },
  { id: 'p6', name: 'Commercial Office Floor', location: 'Motijheel, Dhaka', price: '৳ 2,20,000 / month', image: u('1486406146926-c627a92ad1ab'), meta: '2,400 sqft', status: 'For Rent' },
];

export const DEMO_CATEGORIES = [
  { name: 'Houses', image: u('1600596542815-ffad4c1539a9', 700) },
  { name: 'Apartments', image: u('1545324418-cc1a3fa10c00', 700) },
  { name: 'Villas', image: u('1512917774080-9991f1c4c750', 700) },
  { name: 'Commercial', image: u('1486406146926-c627a92ad1ab', 700) },
];

export const DEMO_HERO_SLIDES = [
  { key: 's1', image: u('1613490493576-7fde63acd811', 2200), eyebrow: 'Modern living awaits', title: ['Find Your'], accent: 'Dream Home', text: 'Discover premium properties in top locations across Bangladesh. Modern design. Better lifestyle. Brighter tomorrow.' },
];

export const DEMO_PROMOS = [
  { key: 'a', kicker: 'Our team is ready to assist you. Get expert advice today!', title: 'Need Help Finding the Right Property?', cta: 'Contact on WhatsApp', image: u('1600210492486-724fe5c67fb0', 200) },
];

export const DEMO_FEATURES = [
  { key: 'f1', title: 'Verified Listings', text: '100% Genuine Properties' },
  { key: 'f2', title: 'Expert Guidance', text: 'From Start to Finish' },
  { key: 'f3', title: 'Best Locations', text: 'Prime Areas Only' },
  { key: 'f4', title: 'After-Sales Support', text: "We're Always Here" },
];
