'use client';

import { useState } from 'react';
import { Award, ChevronDown, Headphones, Heart, Menu, RefreshCw, Search, ShieldCheck, ShoppingCart, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { GadgetstoreCardView } from '../GadgetstoreCard';
import { GsCategories, GsFeatures, GsHero, GsProductGrid, GsPromoBanners, type GsHeroSlide } from '../GadgetstoreHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <GadgetstoreCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%` } : null}
      rating={{ average: p.rating, count: p.reviews }}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'ADD TO CART',
        doneLabel: 'ADDED',
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
    <span className={`block text-[26px] font-bold uppercase tracking-[0.08em] sm:text-[30px] ${light ? 'text-white' : 'text-[#0a0a0a]'}`}>
      G<span className="text-[var(--gs-brand)]">A</span>DGET
    </span>
    <span className={`mt-1.5 block text-[7.5px] font-medium tracking-[0.3em] sm:text-[8.5px] ${light ? 'text-white' : 'text-[#0a0a0a]'}`}>SMARTER EVERYDAY</span>
  </span>
);
const NAV: { label: string; drop?: boolean }[] = [{ label: 'Shop', drop: true }, { label: 'Categories', drop: true }, { label: 'Best Sellers' }, { label: 'New Arrivals' }, { label: 'Deals' }, { label: 'Blog' }, { label: 'About Us' }];
const FEATURE_ICONS = [Truck, ShieldCheck, Award, RefreshCw, Headphones];

/**
 * The Gadgetstore template's demo store (Store > Templates > View, for every plan): Gadgetstore's own parts filled with the template's
 * sample gadgets and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only show
 * what they do. Wrapped in data-theme / data-skin so Gadgetstore's colours and fonts apply.
 */
export function GadgetstoreDemo() {
  const slides: GsHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="gadgetstore" className="min-h-screen bg-white text-[#0a0a0a]">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Gadgetstore</b>. Sample gadgets and pictures; your store shows your own.
      </div>

      <div className="bg-black text-[10px] font-medium uppercase tracking-wide text-white sm:text-[11px]">
        <div className="gs-wrap flex items-center justify-center py-2.5 sm:py-3 md:justify-between">
          <span className="hidden items-center gap-2 md:flex">
            <Truck size={16} strokeWidth={1.5} /> Free shipping on orders over ৳7,000
          </span>
          <span>10% off your first order</span>
          <span className="hidden items-center gap-2 md:flex">
            <RefreshCw size={16} strokeWidth={1.5} /> 30-day easy returns
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
        <div className="gs-wrap flex h-[62px] items-center justify-between gap-3 sm:h-[66px]">
          <Wordmark />
          <nav className="hidden items-center gap-8 text-[12px] font-medium uppercase tracking-wide lg:flex" aria-label="Main">
            {NAV.map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                {l.label}
                {l.drop && <ChevronDown size={12} />}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <Search size={19} strokeWidth={1.6} />
            <Heart size={19} strokeWidth={1.6} />
            <User size={19} strokeWidth={1.6} className="hidden sm:block" />
            <span className="relative">
              <ShoppingCart size={19} strokeWidth={1.6} />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gs-brand)] px-1 text-[9px] font-bold">3</span>
            </span>
            <Menu size={24} className="lg:hidden" />
          </div>
        </div>
      </header>

      <GsHero slides={slides} shopLabel="SHOP NOW" exploreLabel="EXPLORE COLLECTION" exploreHref="#categories" plainImage />
      <GsFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />
      <GsCategories exploreLabel="Shop Now" title="SHOP BY CATEGORY" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <GsProductGrid id="featured" title="BEST SELLERS" viewAllLabel="VIEW ALL" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GsProductGrid>
      <GsPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <GsProductGrid title="NEW ARRIVALS" viewAllLabel="VIEW ALL" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GsProductGrid>

      <footer className="mt-10 border-t border-neutral-100 bg-white">
        <div className="gs-wrap grid gap-9 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-[220px] text-[11px] leading-relaxed">Your one-stop destination for the latest gadgets and smart technology.</p>
          </div>
          {[
            { title: 'SHOP', links: ['Audio', 'Wearables', 'Mobiles & Tablets', 'Gaming'] },
            { title: 'HELP', links: ['Contact Us', 'Shipping', 'Returns', 'Warranty'] },
            { title: 'CONTACT', links: ['hello@gadget.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[11px] font-bold tracking-wider">{col.title}</h4>
              <ul className="space-y-2 text-[12px] text-neutral-600">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-neutral-100 py-4 text-center text-[11px] text-neutral-500">© {new Date().getFullYear()} Gadget (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
