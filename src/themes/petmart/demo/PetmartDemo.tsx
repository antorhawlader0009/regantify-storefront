'use client';

import { useState } from 'react';
import { Heart, Menu, Package, PawPrint, RotateCcw, Search, ShieldCheck, ShoppingCart, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { PetmartCardView } from '../PetmartCard';
import { PkCategories, PkFeatures, PkHero, PkProductGrid, PkPromoBanners, type PkHeroSlide } from '../PetmartHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <PetmartCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      badge={null}
      rating={{ average: p.rating, count: p.reviews }}
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

const Wordmark = ({ light = false }: { light?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <PawPrint size={34} className={light ? 'text-white' : 'text-[#1d4a3c]'} />
    <span className="leading-none">
      <span className={`block text-[26px] font-bold tracking-tight ${light ? 'text-white' : 'text-[#1d4a3c]'}`}>
        Pet<span className={light ? 'text-white' : 'text-[var(--pk-brand)]'}>Mart</span>
      </span>
      <span className={`mt-1 block text-[9px] font-medium ${light ? 'text-white/80' : 'text-slate-500'}`}>For a Brighter, Furrier Tomorrow</span>
    </span>
  </span>
);
const NAV = ['Home', 'Shop', 'Dogs', 'Cats', 'Small Pets', 'Deals'];
const FEATURE_ICONS = [Truck, ShieldCheck, Package, RotateCcw];

/**
 * The Petmart template's demo store (Store > Templates > View, for every plan): Petmart's own parts filled with the template's
 * sample pet products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Petmart's colours and fonts apply.
 */
export function PetmartDemo() {
  const slides: PkHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="petmart" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Petmart</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[#1d4a3c] text-[12px] font-medium text-white">
        <div className="pk-wrap flex items-center justify-center gap-6 py-2.5 sm:justify-between">
          <span className="hidden items-center gap-2 sm:flex">
            <Truck size={15} /> Free Shipping on Orders Over ৳6,000
          </span>
          <span className="flex items-center gap-2">
            <PawPrint size={14} /> Happy Pets, Happier Lives
          </span>
          <span className="hidden items-center gap-2 md:flex">10% Off Your First Order</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
        <div className="pk-wrap">
          <div className="flex items-center gap-4 py-3 lg:gap-10">
            <Menu size={26} className="lg:hidden" />
            <Wordmark />
            <div className="mx-auto hidden w-full max-w-[470px] flex-1 md:block">
              <span className="flex w-full overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-400">
                <span className="flex-1 px-4 py-2.5">Search for food, toys, beds and more...</span>
                <span className="flex w-12 items-center justify-center bg-[var(--pk-brand)] text-white">
                  <Search size={20} />
                </span>
              </span>
              <nav className="mt-2.5 hidden items-center gap-6 pl-1 lg:flex" aria-label="Main">
                {NAV.map((l, i) => (
                  <span key={l} className={`border-b-2 pb-1 text-[13px] font-medium ${i === 0 ? 'border-[var(--pk-brand)] text-[var(--pk-brand)]' : 'border-transparent text-slate-700'}`}>
                    {l}
                  </span>
                ))}
              </nav>
            </div>
            <div className="ml-auto flex items-center gap-4 sm:gap-5 md:ml-0">
              <Search size={24} className="md:hidden" />
              <Heart size={24} />
              <User size={24} className="hidden sm:block" />
              <span className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pk-brand)] px-1 text-[10px] font-bold text-white">3</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <PkHero slides={slides} shopLabel="Shop Now" plainImage />
      <PkCategories exploreLabel="Shop Now" title="Shop by Category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <PkProductGrid id="featured" title="Popular Products" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PkProductGrid>
      <PkPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <PkProductGrid title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PkProductGrid>
      <PkFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.4} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-10 bg-[#1d4a3c] text-white">
        <div className="pk-wrap grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-5 max-w-[220px] text-xs leading-relaxed text-white/80">Premium pet products for a healthier, happier life. Because pets are family.</p>
          </div>
          {[
            { title: 'Shop', links: ['Dog Food', 'Cat Food', 'Toys', 'Beds'] },
            { title: 'Help', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@petmart.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-xs text-white/80">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-[11px] text-white/70">© {new Date().getFullYear()} PetMart (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
