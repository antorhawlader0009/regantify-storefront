'use client';

import { useState } from 'react';
import { Headphones, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { MallonCardView } from '../MallonCard';
import { MlCategories, MlFeatures, MlHero, MlProductGrid, MlPromoBanners, type MlHeroSlide } from '../MallonHome';
import { BagIcon, HeartIcon, MenuIcon, UserIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <MallonCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%`, tone: 'sale' } : p.isNew ? { text: 'New' } : null}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to Cart',
        doneLabel: 'Added ✓',
        done: added,
        onClick: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1400);
        },
      }}
    />
  );
}

const Wordmark = () => <span className="text-[28px] font-bold tracking-tight lg:text-[34px]">Mallon</span>;
const NAV = ['HOME', 'BEST SELLERS', 'HOT DEALS', 'SHOP', 'CONTACT'];

/**
 * The Mallon template's demo store (Store > Templates > View, for every plan): Mallon's own parts filled with the template's
 * sample healthcare products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Mallon's colours and fonts apply.
 */
export function MallonDemo() {
  const slides: MlHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="mallon" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Mallon</b>. Sample products and pictures; your store shows your own.
      </div>

      <header className="border-b border-gray-100 bg-white">
        <div className="ml-wrap flex items-center justify-between gap-x-4 py-3 lg:py-4">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark />
          <span className="hidden h-10 w-full max-w-[560px] flex-1 overflow-hidden rounded border border-gray-200 text-[12px] text-gray-500 lg:flex">
            <span className="flex-1 px-4 py-2.5">Search products</span>
            <span className="flex items-center bg-[var(--ml-brand)] px-6 font-medium text-white">Search</span>
          </span>
          <div className="flex items-center gap-5">
            <HeartIcon className="h-[22px] w-[22px]" />
            <UserIcon className="h-[22px] w-[22px]" />
            <BagIcon className="h-[22px] w-[22px]" />
          </div>
        </div>
        <div className="hidden border-t border-gray-100 lg:block">
          <div className="ml-wrap flex items-center gap-8 py-3">
            <span className="flex w-[225px] items-center justify-between rounded-sm bg-[var(--ml-brand)] px-4 py-3 text-[12px] font-semibold text-white">
              <span>All Categories</span>
              <span aria-hidden>▾</span>
            </span>
            <nav className="flex items-center gap-6" aria-label="Main">
              {NAV.map((l) => (
                <span key={l} className="text-[11px] font-medium">
                  {l}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <MlHero slides={slides} shopLabel="Shop Now" plainImage />
      <MlFeatures
        title="Why shop with us"
        items={[
          { key: '1', icon: <Truck strokeWidth={1.5} />, title: 'Free Delivery', text: 'On orders over ৳5,000' },
          { key: '2', icon: <ShieldCheck strokeWidth={1.5} />, title: '100% Genuine', text: 'Licensed pharmacy products' },
          { key: '3', icon: <RotateCcw strokeWidth={1.5} />, title: 'Easy Returns', text: 'Within 7 days' },
          { key: '4', icon: <Headphones strokeWidth={1.5} />, title: 'Health Advice', text: 'Talk to a pharmacist' },
        ]}
      />
      <MlCategories
        exploreLabel="Explore"
        title="Shop by Category"
        viewAllLabel="View All Categories"
        viewAllHref="#featured"
        plainImage
        items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))}
      />
      <MlPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <MlProductGrid id="featured" title="Popular Healthcare Products" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </MlProductGrid>

      <footer className="mt-10 border-t border-gray-200 bg-[var(--ml-sand)] text-gray-500">
        <div className="ml-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[26px] font-bold text-ink">Mallon</p>
            <p className="mt-2 text-[12px]">Your trusted online healthcare store.</p>
          </div>
          {[
            { title: 'Quick Links', links: ['About Us', 'Delivery', 'Privacy Policy', 'Terms'] },
            { title: 'Categories', links: ['Medicine', 'Vitamins', 'Baby Care', 'Devices'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[13px] font-semibold text-ink">{col.title}</h4>
              <ul className="space-y-2 text-[12px]">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-3 text-[13px] font-semibold text-ink">Contact</h4>
            <ul className="space-y-2 text-[12px]">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--ml-teal)]" /> Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--ml-teal)]" /> +880 1234 567890
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--ml-teal)]" /> hello@mallon.example
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 py-3 text-center text-[11px]">© {new Date().getFullYear()} Mallon (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
