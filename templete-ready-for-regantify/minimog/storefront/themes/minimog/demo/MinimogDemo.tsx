'use client';

import { useState } from 'react';
import { Clock, Heart, Menu, Search, ShieldCheck, ShoppingBag, Star, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { MinimogCardView } from '../MinimogCard';
import { MgCategories, MgFeatures, MgHero, MgProductGrid, MgPromoBanners, type MgHeroSlide } from '../MinimogHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <MinimogCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%`, tone: 'sale' } : p.isNew ? { text: 'New' } : null}
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

const Wordmark = () => (
  <span className="flex items-center gap-2">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mg-brand)] text-white">
      <ShoppingBag size={17} />
    </span>
    <span className="text-[17px] font-bold">Minimog</span>
  </span>
);
const NAV = ['Home', 'Shop', 'Collections', 'Best Sellers', 'New Arrivals', 'Sale', 'About'];
const FEATURE_ICONS = [Truck, Clock, ShieldCheck, Star];

/**
 * The Minimog template's demo store (Store > Templates > View, for every plan): Minimog's own parts filled with the template's
 * sample lifestyle products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Minimog's colours and fonts apply.
 */
export function MinimogDemo() {
  const slides: MgHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="minimog" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Minimog</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--mg-deeper)] text-[12px] text-white">
        <div className="mg-wrap flex items-center justify-center gap-8 py-2.5 sm:justify-between">
          <span className="flex items-center gap-2">
            <Truck size={13} /> Free Shipping on Orders Over ৳5,000
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <ShieldCheck size={13} /> 30-Day Money Back Guarantee
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mg-wrap flex h-[68px] items-center justify-between">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-[14px] font-medium lg:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`border-b-2 py-5 ${i === 0 ? 'border-[var(--mg-brand)] text-[var(--mg-brand-dark)]' : 'border-transparent'}`}>
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Search size={20} />
            <User size={20} className="hidden sm:block" />
            <Heart size={20} />
            <ShoppingBag size={20} />
            <Menu size={22} className="lg:hidden" />
          </div>
        </div>
      </header>

      <MgHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collections" exploreHref="#categories" plainImage />
      <MgFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />
      <MgCategories exploreLabel="Shop" title="Shop by Category" viewAllLabel="View all collections" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <MgPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <MgProductGrid id="featured" title="Trending Products" viewAllLabel="View all products" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </MgProductGrid>

      <footer className="mt-10 border-t border-neutral-200 bg-neutral-50/60 text-neutral-600">
        <div className="mg-wrap grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[220px] text-[11px] leading-relaxed">Quality products, unmatched style, and exceptional customer service. That&apos;s our promise to you.</p>
          </div>
          {[
            { title: 'Shop', links: ['All Products', 'Best Sellers', 'New Arrivals', 'Sale Items'] },
            { title: 'Customer Care', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Company', links: ['About Us', 'Privacy Policy', 'Terms'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[12px] font-bold text-ink">{col.title}</h4>
              <ul className="space-y-2 text-[11px]">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 py-3 text-center text-[10px]">© {new Date().getFullYear()} Minimog (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
