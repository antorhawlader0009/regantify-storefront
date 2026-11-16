'use client';

import { useState } from 'react';
import { Headphones, Heart, LayoutGrid, Lock, Menu, RotateCcw, Search, ShoppingCart, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { NovellaCardView } from '../NovellaCard';
import { NvCategories, NvFeatures, NvHero, NvProductGrid, NvPromoBanners, type NvHeroSlide } from '../NovellaHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <NovellaCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
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
  <span className={`text-[19px] font-extrabold uppercase tracking-[0.18em] ${light ? 'text-white' : 'text-ink'}`}>Novella</span>
);
const NAV = ['Home', 'Shop', 'New Arrivals', 'Top Deals', 'Best Sellers', 'Home Essentials', 'Electronics', 'Fashion'];
const FEATURE_ICONS = [Truck, RotateCcw, Lock, Headphones];

/**
 * The Novella template's demo store (Store > Templates > View, for every plan): Novella's own parts filled with the template's
 * sample products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Novella's colours and fonts apply.
 */
export function NovellaDemo() {
  const slides: NvHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="novella" className="min-h-screen bg-[var(--nv-cream)] text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Novella</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="hidden border-b border-stone-200/70 text-[11px] text-stone-700 sm:block">
        <div className="nv-wrap flex items-center justify-between py-2">
          <span className="flex items-center gap-1.5">
            <Truck size={14} /> Free shipping on orders over ৳5,000 <span className="mx-2 h-3 w-px bg-stone-300" /> Easy 30-day returns
          </span>
          <span className="flex items-center gap-3">
            Track Order <span className="h-3 w-px bg-stone-300" /> Help Center
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[var(--nv-cream)]">
        <div className="nv-wrap">
          <div className="flex h-16 items-center gap-3 sm:h-[76px] lg:gap-8">
            <Menu size={22} className="lg:hidden" />
            <Wordmark />
            <span className="mx-auto hidden h-11 w-full max-w-[560px] flex-1 items-stretch overflow-hidden rounded-md border border-stone-300 bg-white lg:flex">
              <span className="flex flex-1 items-center px-4 text-[13px] text-stone-400">Search products, brands and more…</span>
              <span className="flex w-12 items-center justify-center bg-ink text-white">
                <Search size={16} />
              </span>
            </span>
            <div className="ml-auto flex items-center gap-4 sm:gap-6">
              <Search size={22} className="lg:hidden" />
              <User size={22} className="hidden sm:block" />
              <Heart size={22} className="hidden sm:block" />
              <span className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">3</span>
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 pb-3 text-[13px] font-medium lg:flex" aria-label="Main">
            <span className="flex items-center gap-2 font-semibold">
              <LayoutGrid size={16} /> Categories
            </span>
            {NAV.map((l, i) => (
              <span key={l} className={i === 0 ? 'font-semibold text-[var(--nv-brand)]' : 'text-stone-800'}>
                {l}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <NvHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <NvCategories exploreLabel="Shop Now" title="Shop by Category" viewAllLabel="View all categories" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <NvPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <NvProductGrid id="featured" title="Trending Now" viewAllLabel="View all products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </NvProductGrid>
      <NvProductGrid title="Recommended for You" viewAllLabel="View all recommendations" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </NvProductGrid>
      <NvFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.4} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-14 bg-[#141414] text-stone-300">
        <div className="nv-wrap grid gap-10 py-12 md:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-[230px] text-xs leading-relaxed text-stone-400">Your trusted marketplace for quality products across every part of your life. Shop smart. Live better.</p>
          </div>
          {[
            { title: 'Shop', links: ['New Arrivals', 'Top Deals', 'Best Sellers', 'Electronics'] },
            { title: 'Support', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@novella.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold text-white">{col.title}</h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-stone-800 py-4 text-center text-[11px] text-stone-500">© {new Date().getFullYear()} Novella (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
