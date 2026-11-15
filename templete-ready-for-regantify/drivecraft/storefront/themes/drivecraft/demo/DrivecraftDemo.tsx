'use client';

import { useState } from 'react';
import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { DrivecraftCardView } from '../DrivecraftCard';
import { DcCategories, DcFeatures, DcHero, DcProductGrid, DcPromoBanners, type DcHeroSlide } from '../DrivecraftHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;
const display = { fontFamily: 'var(--font-roboto-cond), Impact, sans-serif' } as const;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <DrivecraftCardView
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
  <span className="inline-flex items-center gap-1.5">
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden className="-skew-x-12">
      <path d="M0 0h16l10 9-10 9H0l8-9z" fill="#d3161d" />
      <path d="M3 3h11l7 6-7 6H3l6-6z" fill="#fff" opacity=".9" />
    </svg>
    <span className="dc-logo block text-[28px] leading-none text-white">
      DRIVE<span className="text-[var(--dc-red)]">CRAFT</span>
    </span>
  </span>
);

const FEATURE_ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];
const NAV = ['Shop by Category', 'Shop', 'Blog', 'Help Center', 'About'];

/**
 * The Drivecraft template's demo store (Store > Templates > View, for every plan): Drivecraft's own parts filled with sample car and bike accessories
 * and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only show what they
 * do. Wrapped in data-theme / data-skin so Drivecraft's colours and fonts apply.
 */
export function DrivecraftDemo() {
  const slides: DcHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="drivecraft" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Drivecraft</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--dc-ink)] text-[11px] font-medium uppercase tracking-wide text-white">
        <div className="dc-wrap flex items-center justify-between gap-4 py-2.5">
          <span className="hidden items-center gap-2 md:flex">
            <Truck size={18} className="text-[var(--dc-red)]" /> Gear Up. Drive Proud.
          </span>
          <span className="mx-auto text-center md:mx-0">
            Free shipping on orders over ৳10,000
          </span>
          <span className="hidden items-center gap-6 md:flex">
            <span>Help &amp; FAQ</span>
            <span>Track Order</span>
          </span>
        </div>
      </div>

      <header className="border-b border-white/10 bg-[var(--dc-ink)] text-white">
        <div className="dc-wrap relative flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <span className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <Logo />
          </span>
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className="font-display text-[12px] font-bold uppercase tracking-wide">
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden w-52 items-center overflow-hidden rounded-sm bg-white text-[#0c0c0d] lg:flex xl:w-72">
              <span className="flex-1 py-2.5 pl-3 text-xs text-zinc-500">Search products...</span>
              <span className="flex items-center self-stretch bg-[var(--dc-red)] px-3 text-white">
                <SearchIcon className="h-[18px] w-[18px]" />
              </span>
            </span>
            <UserIcon className="hidden h-[22px] w-[22px] sm:block" />
            <span className="relative hidden sm:block">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dc-red)] px-1 text-[10px] font-bold text-white">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dc-red)] px-1 text-[10px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <DcHero slides={slides} shopLabel="Shop Bestsellers" exploreLabel="Explore Collection" exploreHref="#featured" plainImage />
      <DcCategories exploreLabel="Shop Now" plainImage title="Shop by Category" viewAllLabel="View All" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <DcProductGrid id="featured" title="Featured Products" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 6).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </DcProductGrid>
      <DcPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <DcProductGrid title="Best Deals" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(6).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </DcProductGrid>
      <DcFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />

      <section className="bg-gradient-to-r from-[#5a0a0d] via-[#d3161d] to-[#5a0a0d] text-white">
        <div className="dc-wrap flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider">Stay in the loop</p>
            <p className="mt-0.5 text-[11px] text-white/70">Get exclusive deals, new product alerts and expert tips.</p>
          </div>
          <span className="flex w-full md:max-w-xl">
            <span className="flex-1 bg-white px-4 py-3 text-xs text-zinc-500">Enter your email address</span>
            <span className="bg-[#0c0c0d] px-8 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Subscribe</span>
          </span>
        </div>
      </section>

      <footer className="bg-[var(--dc-footer)] text-white">
        <div className="dc-wrap grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-300">
              Premium accessories, riding gear and care products built for drivers and riders who demand more.
            </p>
          </div>
          {[
            ['Shop', ['All Products', 'Care & Detailing', 'Comfort & Interior', 'Exterior & Protection', 'Garage']],
            ['Customer Care', ['Contact Us', 'Shipping & Delivery', 'Returns & Refunds', 'Track Order']],
            ['Company', ['About Us', 'Our Story', 'Blog']],
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
        <p className="border-t border-white/10 py-4 text-center text-[10px] uppercase tracking-wider text-neutral-400">© {new Date().getFullYear()} DRIVECRAFT (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
