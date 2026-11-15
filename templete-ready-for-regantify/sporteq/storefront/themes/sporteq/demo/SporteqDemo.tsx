'use client';

import { useState } from 'react';
import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { SporteqCardView } from '../SporteqCard';
import { EqCategories, EqFeatures, EqHero, EqProductGrid, EqPromoBanners, type EqHeroSlide } from '../SporteqHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <SporteqCardView
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
  <span className="leading-none">
    <span className={`eq-logo block text-[26px] sm:text-[30px] ${light ? 'text-white' : 'text-[#0e0e0e]'}`}>
      SPORT<span className="text-[var(--eq-lime)]">EQ</span>
    </span>
    <span className={`mt-1 block text-[7px] font-bold tracking-[0.42em] sm:text-[8px] ${light ? 'text-white' : 'text-[#0e0e0e]'}`}>EQUIP YOUR BEST</span>
  </span>
);
const NAV = ['Shop', 'Categories', 'Best Sellers', 'New Arrivals', 'Brands', 'Deals', 'Blog', 'About Us'];
const FEATURE_ICONS = [Truck, ShieldCheck, Headphones, RotateCcw];

/**
 * The Sporteq template's demo store (Store > Templates > View, for every plan): Sporteq's own parts filled with the template's
 * sample equipment and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Sporteq's colours and fonts apply.
 */
export function SporteqDemo() {
  const slides: EqHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="sporteq" className="min-h-screen bg-white text-[#0e0e0e]">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Sporteq</b>. Sample equipment and pictures; your store shows your own.
      </div>

      <div className="bg-[#1a1a1a] text-[11px] font-medium text-white sm:text-xs">
        <div className="eq-wrap flex items-center justify-center py-2.5 md:justify-between">
          <span className="uppercase">Free shipping on orders over ৳12,000</span>
          <span className="hidden uppercase md:inline">
            10% off your first order <span className="mx-1 text-white/40">|</span> Use code: <b className="text-[var(--eq-lime)]">SPORT10</b>
          </span>
          <span className="hidden uppercase lg:inline">30-day easy returns</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#1b1b1b] text-white shadow-lg shadow-black/20">
        <div className="eq-wrap flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark light />
          <nav className="hidden items-center gap-7 text-[13px] font-medium uppercase tracking-wide lg:flex xl:gap-9" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className={l === 'Deals' ? 'text-[var(--eq-lime)]' : ''}>
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <SearchIcon className="h-[22px] w-[22px]" />
            <UserIcon className="hidden h-[22px] w-[22px] sm:block" />
            <HeartIcon className="hidden h-[22px] w-[22px] sm:block" />
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--eq-lime)] px-1 text-[9px] font-bold text-[#0e0e0e]">3</span>
            </span>
          </div>
        </div>
      </header>

      <EqHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <EqFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />
      <EqCategories exploreLabel="Shop Now" title="Shop by Category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <EqProductGrid id="featured" title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 6).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </EqProductGrid>
      <EqPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <EqProductGrid title="New Arrivals" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </EqProductGrid>

      <footer className="mt-14 border-t border-neutral-200 bg-white text-neutral-700">
        <div className="eq-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-neutral-600">Your one-stop destination for high-quality sports equipment and accessories.</p>
          </div>
          {[
            { title: 'Shop', links: ['Football', 'Basketball', 'Cricket', 'Tennis'] },
            { title: 'Customer Service', links: ['Help Center', 'Shipping & Delivery', 'Returns & Refunds', 'Track Your Order'] },
            { title: 'Contact', links: ['hello@sporteq.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#0e0e0e]">{col.title}</h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} SportEQ (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
