'use client';

import { useState } from 'react';
import { Heart, Menu, ShoppingBag, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { FurniluxCardView } from '../FurniluxCard';
import { FuBrands, FuCategories, FuHero, FuProductGrid, FuPromoBanners, type FuHeroSlide } from '../FurniluxHome';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <FurniluxCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.badge ? { text: p.badge.text, tone: p.badge.sale ? 'sale' : 'brand', color: p.badge.sale ? '#e11d2e' : '#3f6b1f' } : null}
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
  <span className={`text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-neutral-900'}`}>
    FurniLux<span className="text-[var(--fu-brand)]">.</span>
  </span>
);
const NAV = ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Outdoor', 'Decor'];

/**
 * The Furnilux template's demo store (Store > Templates > View, for every plan): Furnilux's own parts filled with the template's
 * sample furniture and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons
 * only show what they do. Wrapped in data-theme / data-skin so Furnilux's colours and fonts apply.
 */
export function FurniluxDemo() {
  const slides: FuHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="furnilux" className="min-h-screen bg-white text-neutral-900">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Furnilux</b>. Sample products and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white">
        <div className="fu-wrap flex h-16 items-center justify-between gap-4 xl:h-[72px]">
          <div className="flex items-center gap-3">
            <Menu size={24} className="lg:hidden" />
            <Wordmark />
          </div>
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className="py-6 text-[11px] font-semibold uppercase">
                {l}
              </span>
            ))}
            <span className="rounded bg-[var(--fu-brand)] px-3 py-1 text-[11px] font-bold uppercase text-white">Sale</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden w-52 rounded-full border border-stone-200 px-4 py-2 text-xs text-neutral-400 xl:block">Search products…</span>
            <User size={19} />
            <Heart size={19} />
            <ShoppingBag size={19} />
          </div>
        </div>
      </header>

      <FuHero slides={slides} shopLabel="Shop Now" plainImage />
      <FuCategories exploreLabel="Explore" title="Shop by Room" viewAllLabel="View All" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <FuProductGrid id="featured" title="Featured Products" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </FuProductGrid>
      <FuBrands title="Our Brands" brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))} stylesLabel={(n) => `${n} products`} />
      <FuPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />

      <footer className="mt-14 bg-neutral-900 text-neutral-300">
        <div className="fu-wrap grid gap-10 py-12 md:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-3 text-sm text-neutral-400">Premium furniture crafted for beautiful spaces and better living.</p>
          </div>
          {[
            { title: 'Shop', links: ['Living Room', 'Bedroom', 'Dining Room', 'All Products'] },
            { title: 'Account', links: ['Login / Register', 'Wishlist', 'Cart', 'Shipping & Returns'] },
            { title: 'Contact', links: ['hello@furnilux.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} FurniLux (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
