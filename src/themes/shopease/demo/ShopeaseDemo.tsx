'use client';

import { useState } from 'react';
import { Headphones, Heart, Medal, Menu, RotateCcw, Search, ShoppingBag, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { ShopeaseCardView } from '../ShopeaseCard';
import { SeCategories, SeFeatures, SeHero, SeProductGrid, SePromoBanners, type SeHeroSlide } from '../ShopeaseHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <ShopeaseCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.isNew ? { text: 'NEW', color: '#111111' } : off > 0 ? { text: `-${off}%`, tone: 'sale' } : null}
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
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--se-brand)] text-white">
      <ShoppingBag size={17} />
    </span>
    <span className="text-2xl font-extrabold tracking-tight">Shop<span className="text-[var(--se-brand)]">Ease</span></span>
  </span>
);
const NAV = ['Home', 'Shop', 'New In', 'Women', 'Men', 'Home & Living', 'Deals'];
const FEATURE_ICONS = [Truck, RotateCcw, Medal, Headphones];

/**
 * The Shopease template's demo store (Store > Templates > View, for every plan): Shopease's own parts filled with the template's
 * sample lifestyle products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Shopease's colours and fonts apply.
 */
export function ShopeaseDemo() {
  const slides: SeHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="shopease" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Shopease</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--se-deeper)] text-[12px] text-white">
        <div className="se-wrap flex items-center justify-center gap-8 py-2.5 sm:justify-between">
          <span className="flex items-center gap-2">
            <Truck size={13} /> Free Shipping on orders over ৳7,500
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <Medal size={13} /> Extra 10% off on prepaid orders
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
        <div className="se-wrap flex h-[68px] items-center justify-between">
          <Wordmark />
          <nav className="hidden items-center gap-8 text-[15px] font-medium lg:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`py-5 ${i === 0 ? 'text-[var(--se-brand)]' : ''}`}>
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

      <SeHero slides={slides} shopLabel="Explore Collection" exploreLabel="" plainImage />
      <SeCategories exploreLabel="Shop Now" title="Shop By Category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <SePromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <SeProductGrid id="featured" title="New Arrivals" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </SeProductGrid>
      <SeProductGrid title="Trending Products" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </SeProductGrid>
      <SeFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-10 bg-[#f4efe8] text-neutral-700">
        <div className="se-wrap grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[220px] text-[11px] leading-relaxed">Your one-stop destination for quality products at unbeatable prices.</p>
          </div>
          {[
            { title: 'QUICK LINKS', links: ['New In', 'Best Sellers', 'Deals', 'Track Order'] },
            { title: 'CUSTOMER CARE', links: ['FAQs', 'Shipping Policy', 'Returns & Refunds', 'Contact Us'] },
            { title: 'CONTACT US', links: ['hello@shopease.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
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
        <div className="border-t border-neutral-200 py-3 text-center text-[10px]">© {new Date().getFullYear()} Shopease (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
