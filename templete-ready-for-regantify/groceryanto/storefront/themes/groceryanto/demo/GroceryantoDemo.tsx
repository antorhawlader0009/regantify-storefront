'use client';

import { useState } from 'react';
import { Coffee, DollarSign, Heart, Menu, ShoppingBag, Truck, User, Apple } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { GroceryantoCardView } from '../GroceryantoCard';
import { GaCategories, GaFeatures, GaHero, GaProductGrid, GaPromoBanners, type GaHeroSlide } from '../GroceryantoHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <GroceryantoCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.salePrice ?? p.price)}
      oldPrice={p.salePrice ? taka(p.price) : null}
      badge={p.salePrice ? { text: 'Sale' } : null}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to cart',
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

const NAV = ['Home', 'Blog', 'Shop', 'Vegetables & Fruits', 'FoodGrains & Oil', 'Dairy Products', 'Contact Us'];
const FEATURE_ICONS = [Truck, Apple, Coffee, DollarSign];

/**
 * The Groceryanto template's demo store (Store > Templates > View, for every plan): Groceryanto's own parts filled with the
 * template's sample groceries, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Groceryanto's colours and fonts apply.
 */
export function GroceryantoDemo() {
  const slides: GaHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="groceryanto" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Groceryanto</b>. Sample groceries; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 border-b border-[#ebebeb] bg-white">
        <div className="ga-wrap">
          <div className="flex items-center gap-3 py-[16px] lg:gap-8 lg:py-[30px]">
            <Menu size={24} className="lg:hidden" />
            <span className="font-display text-[26px] font-medium text-ink lg:text-[32px]">Groceryanto</span>
            <span className="relative mx-auto hidden h-[47px] w-full max-w-[550px] flex-1 items-center overflow-hidden rounded-[32px] border border-[#e7f5ff] bg-white pr-1 text-left md:flex">
              <span className="flex-1 px-[13px] text-[14px] text-[#757575]">Search for products...</span>
              <span className="flex h-9 shrink-0 items-center rounded-2xl bg-black px-4 text-base text-white">Search</span>
            </span>
            <div className="ml-auto flex items-center gap-[14px] md:ml-0">
              <Heart size={24} className="hidden sm:block" />
              <User size={24} className="hidden sm:block" />
              <span className="relative flex h-[38px] items-center gap-2 rounded-[10px] border border-[#f1f1f1] bg-white px-[7px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <ShoppingBag size={24} />
                <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ga-brand)] px-1 text-[11px] leading-none text-white">3</span>
                <span className="hidden pr-1 text-[14px] sm:inline">৳1,860</span>
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-1 border-t border-[#ebebeb] lg:flex" aria-label="Main">
            <span className="mr-[2%] flex h-[45px] min-w-[184px] items-center rounded-[5px] bg-[var(--ga-brand)] px-4 text-lg font-medium text-white">☰&nbsp; All Categories</span>
            {NAV.map((l, i) => (
              <span key={l} className={`px-3 py-[10px] text-sm ${i === 0 ? 'text-[var(--ga-brand)]' : 'text-ink'}`}>
                {l}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <GaHero slides={slides} shopLabel="Shop Now" plainImage />
      <GaCategories exploreLabel="Shop Now" title="Shop by Category" viewAllLabel="View all" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <GaProductGrid id="featured" title="Clean And Green Vegetable" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GaProductGrid>
      <GaPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <GaProductGrid title="Sale Is Live Now" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GaProductGrid>
      <GaFeatures
        title="Store benefits"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.2} />, title: f.title, text: f.text };
        })}
      />

      <footer className="bg-[#f7f8f9] text-[#444]">
        <div className="ga-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-display text-[26px] font-medium text-ink">Groceryanto</span>
            <p className="mt-3 max-w-[260px] text-sm">Organic vegetables, fruits, dairy and everyday essentials.</p>
          </div>
          {[
            { title: 'Shop', links: ['Vegetables & Fruits', 'Dairy Products', 'Beverages', 'Pet Care'] },
            { title: 'Help', links: ['Contact Us', 'Delivery', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@groceryanto.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 font-display text-base font-medium text-ink">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-[#ebebeb] py-4 text-center text-xs text-[#767676]">© {new Date().getFullYear()} Groceryanto (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
