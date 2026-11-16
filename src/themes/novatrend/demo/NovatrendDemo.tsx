'use client';

import { useState } from 'react';
import { Headphones, Heart, Menu, RefreshCcw, Search, ShieldCheck, ShoppingCart, Tag, Truck, User, Zap } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { NovatrendCardView } from '../NovatrendCard';
import { NtCategories, NtFeatures, NtHero, NtProductGrid, NtPromoBanners, type NtHeroSlide } from '../NovatrendHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <NovatrendCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.badge ? { text: p.badge.text, tone: p.badge.sale ? 'sale' : 'brand', color: p.badge.sale ? '#ff4b0f' : '#0b0b0b' } : null}
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
  <span className={`text-xl font-extrabold tracking-tight sm:text-2xl ${light ? 'text-white' : 'text-ink'}`}>
    Nova<span className="text-[var(--nt-brand)]">Trend</span>
  </span>
);
const NAV = ['Home', 'Shop', 'New Arrivals', 'Best Sellers', 'Categories'];
const FEATURE_ICONS = [Truck, ShieldCheck, RefreshCcw, Headphones];

/**
 * The Novatrend template's demo store (Store > Templates > View, for every plan): Novatrend's own parts filled with the template's
 * sample products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Novatrend's colours and fonts apply.
 */
export function NovatrendDemo() {
  const slides: NtHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="novatrend" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Novatrend</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-black text-white">
        <div className="nt-wrap flex h-10 items-center justify-center gap-8 text-[11px] font-medium sm:text-xs lg:gap-14">
          <span className="flex items-center gap-2">
            <Truck size={14} /> Free Worldwide Shipping Over ৳5,000
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <Tag size={14} className="text-[var(--nt-brand)]" /> Summer Sale Up To 70% Off
          </span>
          <span className="hidden items-center gap-2 lg:flex">
            <Zap size={14} className="text-amber-400" /> Limited Time Flash Deals
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white">
        <div className="nt-wrap flex h-16 items-center gap-4 lg:h-[70px]">
          <Menu size={22} className="lg:hidden" />
          <Wordmark />
          <nav className="mr-auto hidden h-full items-stretch gap-6 pl-6 text-xs font-semibold uppercase tracking-wide lg:flex xl:gap-9 xl:pl-10" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`relative flex items-center ${i === 0 ? 'text-[var(--nt-brand)]' : ''}`}>
                {l}
                {i === 0 && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--nt-brand)]" />}
              </span>
            ))}
          </nav>
          <span className="mx-auto hidden w-[220px] items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-xs text-neutral-500 lg:mx-0 lg:flex xl:w-[270px]">
            <Search size={14} /> Search products…
          </span>
          <div className="ml-auto flex items-center gap-4 sm:gap-5 lg:ml-0">
            <User size={20} className="hidden sm:block" />
            <Heart size={20} className="hidden sm:block" />
            <span className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--nt-brand)] px-1 text-[9px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <NtHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <NtFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />
      <NtCategories exploreLabel="Shop Now" title="Shop by Categories" viewAllLabel="View All Categories" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <NtProductGrid id="featured" title="New Arrivals" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </NtProductGrid>
      <NtProductGrid title="Best Sellers" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </NtProductGrid>
      <NtPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />

      <footer className="mt-14 bg-[#0b0b0b] text-neutral-400">
        <div className="nt-wrap grid gap-10 py-12 md:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-3 text-sm">Trending products for modern lifestyles, delivered to your door.</p>
          </div>
          {[
            { title: 'Shop', links: ['New Arrivals', 'Best Sellers', 'Fashion', 'Electronics'] },
            { title: 'Support', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@novatrend.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="space-y-2 text-[13px]">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} NovaTrend (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
