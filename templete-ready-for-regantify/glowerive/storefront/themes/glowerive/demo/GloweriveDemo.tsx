'use client';

import { useState } from 'react';
import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { GloweriveCardView } from '../GloweriveCard';
import { GwCategories, GwFeatures, GwHero, GwProductGrid, GwPromoBanners, type GwHeroSlide } from '../GloweriveHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;
const display = { fontFamily: 'var(--font-cormorant), Impact, sans-serif' } as const;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <GloweriveCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.badge ? { text: p.badge.text, tone: p.badge.sale ? 'sale' : 'brand' } : null}
      rating={{ average: p.rating, count: p.reviews }}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to Cart',
        doneLabel: 'Added',
        done: added,
        onClick: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1400);
        },
      }}
      secondary={{ label: 'Buy now', onClick: () => undefined }}
    />
  );
}

const Logo = () => (
  <span className="inline-flex items-center gap-2.5">
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden className="text-white" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 26C6 14 14 6 27 5c0 12-7 20-18 20" />
      <path d="M6 26c4-7 9-11 15-14" />
    </svg>
    <span className="gw-logo block text-[28px] leading-none text-white">Glowérive</span>
  </span>
);

const FEATURE_ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];
const NAV = ['Home', 'Shop', 'Category', 'Best Selling', 'About Us'];

/**
 * The Glowerive template's demo store (Store > Templates > View, for every plan): Glowerive's own parts filled with sample skincare products
 * and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only show what they
 * do. Wrapped in data-theme / data-skin so Glowerive's colours and fonts apply.
 */
export function GloweriveDemo() {
  const slides: GwHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="glowerive" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Glowerive</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[#0f4a42] text-[11px] text-white/90 sm:text-xs">
        <div className="gw-wrap flex items-center justify-between gap-4 py-2.5">
          <span className="hidden items-center gap-2 md:flex">
            <Truck size={16} /> Free Shipping on Orders Over ৳5,000
          </span>
          <span className="mx-auto text-center md:mx-0">
            Track Order  |  FAQ  |  Contact Us
          </span>
          <span className="hidden items-center gap-6 md:flex">
            <span>Help &amp; FAQ</span>
            <span>Track Order</span>
          </span>
        </div>
      </div>

      <header className="border-b border-white/10 bg-[var(--gw-ink)] text-white">
        <div className="gw-wrap relative flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <span className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <Logo />
          </span>
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className="border-b border-transparent pb-1 text-[12px] font-medium uppercase tracking-wider">
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden w-52 items-center overflow-hidden rounded-full border border-white/25 bg-white/15 text-white lg:flex xl:w-72">
              <span className="flex-1 py-2.5 pl-4 text-xs text-white/70">Search products...</span>
              <span className="flex items-center self-stretch px-4 text-white">
                <SearchIcon className="h-[18px] w-[18px]" />
              </span>
            </span>
            <UserIcon className="hidden h-[22px] w-[22px] sm:block" />
            <span className="relative hidden sm:block">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-[var(--gw-brand)]">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-[var(--gw-brand)]">3</span>
            </span>
          </div>
        </div>
      </header>

      <GwHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#featured" plainImage />
      <GwCategories exploreLabel="Shop Now" plainImage title="Shop by Category" viewAllLabel="View All" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <GwProductGrid id="featured" title="Featured Products" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GwProductGrid>
      <GwPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <GwProductGrid title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </GwProductGrid>
      <GwFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />

      <section className="bg-gradient-to-r from-[#0f4a42] via-[#1c6f65] to-[#0f4a42] text-white">
        <div className="gw-wrap flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider">Join Now</p>
            <p className="mt-0.5 text-[11px] text-white/70">Be the first to know about new arrivals and exclusive deals.</p>
          </div>
          <span className="flex w-full md:max-w-xl">
            <span className="flex-1 rounded-l-full bg-white px-5 py-3 text-xs text-zinc-500">Enter your email address</span>
            <span className="rounded-r-full bg-[#0f4a42] px-8 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Join</span>
          </span>
        </div>
      </section>

      <footer className="bg-[var(--gw-footer)] text-white">
        <div className="gw-wrap grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-300">
              Gentle, plant-based skincare that works. Dermatologist tested, paraben and sulfate free, and never tested on animals.
            </p>
          </div>
          {[
            ['Shop', ['All Products', 'Serums', 'Moisturizers', 'Best Selling']],
            ['Account', ['Login', 'Wishlist', 'Cart']],
            ['Contact', ['hello@glowerive.example', '+880 1234 567 890', 'Dhaka, Bangladesh']],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider !text-white">{h as string}</h4>
              <ul className="mt-3 space-y-2">
                {(ls as string[]).map((x) => (
                  <li key={x} className="text-[11px] text-neutral-300">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-[10px] uppercase tracking-wider text-neutral-400">© {new Date().getFullYear()} GLOWERIVE (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
