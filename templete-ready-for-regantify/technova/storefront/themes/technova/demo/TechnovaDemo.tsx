'use client';

import { useState } from 'react';
import { Headphones, Leaf, RotateCcw, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { TechnovaCardView } from '../TechnovaCard';
import { TnCategories, TnFeatures, TnHero, TnProductGrid, TnPromoBanners, type TnHeroSlide } from '../TechnovaHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <TechnovaCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      badge={null}
      rating={{ average: p.rating, count: p.reviews }}
      extra={p.tagline ? <p className="mt-0.5 text-[11px] text-slate-500">{p.tagline}</p> : null}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to Cart',
        doneLabel: 'Added',
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
  <span className="flex items-center gap-2.5 leading-tight">
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={light ? 'tn-lg2' : 'tn-lg1'} x1="4" y1="4" x2="36" y2="36">
          <stop stopColor="#2f6bff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M6 34V8c0-1.7 2-2.6 3.3-1.4L26 22V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v26c0 1.7-2 2.6-3.3 1.4L14 20v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill={`url(#${light ? 'tn-lg2' : 'tn-lg1'})`} />
    </svg>
    <span>
      <span className={`tn-logo block text-[22px] ${light ? 'text-white' : 'text-[#0b1226]'}`}>TechNova</span>
      <span className={`block text-[9px] font-medium ${light ? 'text-slate-300' : 'text-slate-500'}`}>Smarter Today. Brighter Tomorrow.</span>
    </span>
  </span>
);
const NAV = ['Home', 'Shop', 'Laptops', 'Smartphones', 'Accessories', 'Gaming', 'Smart Home', 'Audio', 'Wearables', 'Cameras'];
const FEATURE_ICONS = [Truck, RotateCcw, Headphones, Leaf];

/**
 * The Technova template's demo store (Store > Templates > View, for every plan): Technova's own parts filled with the template's
 * sample gadgets and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Technova's colours and fonts apply.
 */
export function TechnovaDemo() {
  const slides: TnHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="technova" className="min-h-screen bg-white text-[#0b1226]">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Technova</b>. Sample gadgets and pictures; your store shows your own.
      </div>

      <div className="border-b border-slate-100 bg-white text-[11px] text-slate-600">
        <div className="tn-wrap flex items-center justify-between py-2">
          <span>Free Shipping on All Orders Over ৳12,000</span>
          <span className="hidden gap-6 md:flex">
            <span>Easy Returns</span>
            <span>Tech for a Better Tomorrow</span>
          </span>
          <span className="hidden gap-4 sm:flex">
            <span>Help</span>
            <span>Track Order</span>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#0b1226] text-white shadow-md">
        <div className="tn-wrap flex h-[64px] items-center justify-between gap-4">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark light />
          <div className="ml-auto hidden w-64 overflow-hidden rounded-lg border border-white/15 bg-white/10 sm:flex lg:w-72">
            <span className="flex-1 px-3 py-2 text-sm text-slate-400">Search products...</span>
            <span className="flex items-center bg-[#2f6bff] px-3.5">
              <SearchIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <SearchIcon className="h-[22px] w-[22px] sm:hidden" />
            <UserIcon className="hidden h-[22px] w-[22px] sm:block" />
            <HeartIcon className="hidden h-[22px] w-[22px] sm:block" />
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#2f6bff] px-1 text-[9px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
        <div className="hidden border-t border-white/10 bg-gradient-to-r from-[#101c44] via-[#13224f] to-[#18285c] lg:block">
          <nav className="tn-wrap flex items-center gap-7 text-[13px] font-medium" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`whitespace-nowrap border-b-2 py-3 ${i === 0 ? 'border-[#5b8cff] text-white' : 'border-transparent text-slate-300'}`}>
                {l}
              </span>
            ))}
            <span className="whitespace-nowrap py-3 font-semibold text-red-400">Deals</span>
          </nav>
        </div>
      </header>

      <TnHero slides={slides} shopLabel="Shop the Future" plainImage />
      <TnCategories exploreLabel="Shop Now" title="Shop by Category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <TnProductGrid id="featured" title="Trending Products" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </TnProductGrid>
      <TnPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <TnProductGrid title="Recommended for You" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </TnProductGrid>
      <TnFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-6 border-t border-slate-100 bg-white text-slate-700">
        <div className="tn-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-slate-500">Your trusted destination for the latest laptops, phones and smart gadgets.</p>
          </div>
          {[
            { title: 'Shop', links: ['All Products', 'New Arrivals', 'Best Sellers', 'Deals'] },
            { title: 'Support', links: ['Track Order', 'Returns & Refunds', 'Help Center', 'Contact Us'] },
            { title: 'Contact', links: ['hello@technova.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold text-[#0b1226]">{col.title}</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} TechNova (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
