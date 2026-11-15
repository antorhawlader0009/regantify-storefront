'use client';

import { useState } from 'react';
import { Heart, Menu, RotateCcw, Search, ShieldCheck, ShoppingCart, Smile, Tag, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { PapernestCardView } from '../PapernestCard';
import { PnCategories, PnFeatures, PnHero, PnProductGrid, PnPromoBanners, type PnHeroSlide } from '../PapernestHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <PapernestCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      badge={p.isNew ? { text: 'New' } : null}
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
    <svg width="42" height="42" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 58C18 52 10 38 14 22c8 2 14 10 18 36Z" fill="#7B4DC0" />
      <path d="M32 58C28 40 26 22 36 6c10 12 8 30-4 52Z" fill="#FF5C7A" />
      <path d="M32 58C40 36 46 20 58 18c2 16-8 32-26 40Z" fill="#2BB3C0" />
      <path d="M32 58C24 44 16 34 4 34c2 12 12 22 28 24Z" fill="#FFB020" />
      <path d="M32 58C36 46 42 38 52 34c-2 12-10 20-20 24Z" fill="#F57C2B" opacity=".9" />
    </svg>
    <span className="leading-none">
      <span className={`block text-[26px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-[#1B2A4A]'}`}>PaperNest</span>
      <span className={`block text-[9px] font-medium tracking-wide ${light ? 'text-white/70' : 'text-slate-500'}`}>Write · Create · Belong</span>
    </span>
  </span>
);
const NAV = ['Home', 'Notebooks', 'Pens & Writing', 'Art & Craft', 'Office Supplies', 'School Essentials', 'Planners', 'Brands', 'Deals'];
const FEATURE_ICONS = [Truck, RotateCcw, ShieldCheck, Smile];

/**
 * The Papernest template's demo store (Store > Templates > View, for every plan): Papernest's own parts filled with the template's
 * sample stationery and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Papernest's colours and fonts apply.
 */
export function PapernestDemo() {
  const slides: PnHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="papernest" className="min-h-screen bg-white text-slate-800">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Papernest</b>. Sample stationery and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--pn-brand)] text-[11px] text-white sm:text-xs">
        <div className="pn-wrap flex items-center justify-between py-2">
          <span className="hidden items-center gap-2 sm:flex">
            <Truck size={14} /> Free Shipping on Orders Over ৳6,000
          </span>
          <span className="mx-auto font-medium sm:mx-0 sm:flex-1 sm:text-center">Bright Ideas, Brighter Days!</span>
          <span className="hidden sm:block">Help · Track Order</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
        <div className="pn-wrap flex items-center gap-3 py-3 lg:gap-8">
          <Menu size={22} className="lg:hidden" />
          <Wordmark />
          <span className="hidden h-10 flex-1 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 md:flex">
            <span className="flex flex-1 items-center px-4">Search for notebooks, pens, art supplies...</span>
            <span className="grid w-12 place-items-center rounded-r-lg bg-[var(--pn-brand)] text-white">
              <Search size={18} />
            </span>
          </span>
          <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-[#1B2A4A] sm:gap-3 md:ml-0">
            <span className="flex flex-col items-center px-2">
              <User size={20} />
              <span className="hidden sm:block">Account</span>
            </span>
            <span className="flex flex-col items-center px-2">
              <Heart size={20} />
              <span className="hidden sm:block">Wishlist</span>
            </span>
            <span className="relative flex flex-col items-center px-2">
              <ShoppingCart size={20} />
              <span className="hidden sm:block">Cart</span>
              <span className="absolute -top-1 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF5C7A] px-1 text-[9px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
        <nav className="hidden border-t border-slate-100 lg:block" aria-label="Main">
          <ul className="pn-wrap flex items-center gap-7 text-[13px] font-medium text-slate-700">
            {NAV.map((l, i) => (
              <li key={l} className={`relative flex items-center gap-1 py-2.5 ${i === 0 ? 'text-[var(--pn-brand)]' : ''} ${l === 'Deals' ? 'text-rose-600' : ''}`}>
                {l === 'Deals' && <Tag size={14} className="fill-rose-500 text-rose-500" />}
                {l}
                {i === 0 && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-[var(--pn-brand)]" />}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <PnHero slides={slides} shopLabel="Shop the Collection" plainImage />
      <PnCategories exploreLabel="Shop" title="Shop by category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <PnPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <PnProductGrid id="featured" title="New Arrivals" sub="Fresh picks for your creative journey" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 6).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PnProductGrid>
      <PnProductGrid title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(6).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PnProductGrid>
      <PnFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />

      <footer className="bg-[#1B2A4A] text-white">
        <div className="pn-wrap grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-3 max-w-[220px] text-xs text-white/70">Premium stationery for brighter minds and more creative days.</p>
          </div>
          {[
            { title: 'Shop', links: ['Notebooks', 'Pens & Writing', 'Art & Craft', 'Planners'] },
            { title: 'Help', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@papernest.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-xs text-white/70">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-[11px] text-white/60">© {new Date().getFullYear()} PaperNest (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
