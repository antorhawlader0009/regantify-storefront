'use client';

import { useState } from 'react';
import { Headset, Heart, Leaf, Menu, RotateCcw, Search, ShoppingCart, Sprout, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { GreenmartCardView } from '../GreenmartCard';
import { GmCategories, GmFeatures, GmHero, GmProductGrid, GmPromoBanners, type GmHeroSlide } from '../GreenmartHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <GreenmartCardView
      href="#"
      name={p.name}
      subtitle={p.unit}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%` } : p.isNew ? { text: 'New', color: '#b45309' } : null}
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
  <span className="flex items-center gap-2">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gm-brand)] text-white">
      <Leaf size={18} />
    </span>
    <span className={`text-[24px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>GreenMart</span>
  </span>
);
const NAV = ['Home', 'Categories', 'Shop', 'Deals', 'New Arrivals', 'About Us'];
const FEATURE_ICONS = [Leaf, Sprout, RotateCcw, Headset];

/**
 * The Greenmart template's demo store (Store > Templates > View, for every plan): Greenmart's own parts filled with the template's
 * sample groceries and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Greenmart's colours and fonts apply.
 */
export function GreenmartDemo() {
  const slides: GmHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="greenmart" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Greenmart</b>. Sample groceries and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 bg-white">
        <div className="gm-wrap flex items-center justify-between gap-4 py-3 lg:py-4">
          <Wordmark />
          <div className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <span className="flex items-center gap-2 rounded-lg p-2 sm:px-3">
              <Search size={20} strokeWidth={1.8} /> <span className="hidden lg:inline">Search</span>
            </span>
            <span className="hidden items-center gap-2 rounded-lg px-3 py-2 sm:flex">
              <Heart size={20} strokeWidth={1.7} /> <span className="hidden lg:inline">Favorites</span>
            </span>
            <span className="hidden items-center gap-2 rounded-lg px-3 py-2 sm:flex">
              <User size={20} strokeWidth={1.7} /> <span className="hidden lg:inline">Account</span>
            </span>
            <span className="relative p-2">
              <ShoppingCart size={24} strokeWidth={1.7} />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gm-brand)] px-1 text-[11px] font-bold text-white">3</span>
            </span>
            <Menu size={24} className="md:hidden" />
          </div>
        </div>
        <nav className="hidden border-y border-black/10 md:block" aria-label="Main">
          <ul className="gm-wrap flex items-center gap-6 lg:gap-8">
            {NAV.map((l, i) => (
              <li key={l} className={`relative py-3.5 text-sm font-medium ${i === 0 ? 'text-[var(--gm-brand)]' : ''}`}>
                {l}
                {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--gm-brand)]" />}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <GmHero slides={slides} shopLabel="Shop Now" exploreLabel="Browse Categories" exploreHref="#categories" plainImage />
      <GmCategories exploreLabel="Shop Now" title="Shop by Category" viewAllLabel="View all" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <GmPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <GmProductGrid id="featured" title="New Arrivals" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GmProductGrid>
      <GmProductGrid title="Popular Products" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GmProductGrid>
      <GmFeatures
        title="Why Choose GreenMart?"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />

      <footer className="bg-[#10301a] text-white">
        <div className="gm-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-white/75">Fresh fruits, vegetables and essentials delivered to your door.</p>
          </div>
          {[
            { title: 'Shop', links: ['Fruits', 'Vegetables', 'Dairy & Eggs', 'Snacks'] },
            { title: 'Help', links: ['Contact Us', 'Delivery', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@greenmart.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold">{col.title}</h4>
              <ul className="space-y-2.5 text-sm text-white/75">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/65">© {new Date().getFullYear()} GreenMart (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
