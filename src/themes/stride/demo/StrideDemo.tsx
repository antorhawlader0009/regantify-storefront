'use client';

import { useState } from 'react';
import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { StrideCardView } from '../StrideCard';
import { StBrands, StCategories, StFeatures, StHero, StProductGrid, StPromoBanners, StReviews, type StHeroSlide } from '../StrideHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, DEMO_REVIEWS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;
const display = { fontFamily: 'var(--font-oswald), Impact, sans-serif' } as const;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <StrideCardView
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

const Logo = ({ light = false }: { light?: boolean }) => (
  <span className={`block text-[34px] font-bold uppercase leading-none tracking-[0.04em] ${light ? 'text-white' : 'text-[var(--st-navy)]'}`} style={display}>
    Stride
  </span>
);

const FEATURE_ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];
const NAV = ['New In', 'Men', 'Women', 'Kids', 'Running', 'Sale'];

/**
 * The Stride template's demo store (Store > Templates > View, for every plan): Stride's own parts filled with sample sneakers
 * and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only show what they
 * do. Wrapped in data-theme / data-skin so Stride's colours and fonts apply.
 */
export function StrideDemo() {
  const slides: StHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="stride" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Stride</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--st-navy)] text-[11px] font-medium uppercase tracking-wide text-white">
        <div className="st-wrap flex items-center justify-between gap-4 py-2.5">
          <span className="hidden items-center gap-2 md:flex">
            <Truck size={18} /> Free shipping on orders over ৳10,000
          </span>
          <span className="mx-auto text-center md:mx-0">
            10% off your first order | Code: <b className="text-[var(--st-lime)]">KICK10</b>
          </span>
          <span className="hidden items-center gap-6 md:flex">
            <span>Help &amp; FAQ</span>
            <span>Track Order</span>
          </span>
        </div>
      </div>

      <header className="border-b border-neutral-100 bg-white">
        <div className="st-wrap relative flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <span className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <Logo />
          </span>
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className="text-[12px] font-semibold uppercase tracking-wider">
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden w-52 items-center overflow-hidden rounded-full border border-neutral-300 lg:flex xl:w-80">
              <span className="flex-1 py-2.5 pl-5 text-xs text-neutral-500">Search sneakers…</span>
              <span className="flex items-center self-stretch border-l border-neutral-300 px-4">
                <SearchIcon className="h-[18px] w-[18px]" />
              </span>
            </span>
            <UserIcon className="hidden h-[22px] w-[22px] sm:block" />
            <span className="relative hidden sm:block">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--st-navy)] px-1 text-[10px] font-bold text-white">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--st-navy)] px-1 text-[10px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <StHero slides={slides} shopLabel="Shop New In" exploreLabel="Explore Collection" exploreHref="#featured" plainImage />
      <StCategories exploreLabel="Shop Now" plainImage title="Shop by Category" viewAllLabel="View All" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <StProductGrid id="featured" title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </StProductGrid>
      <StPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <StProductGrid title="New In" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </StProductGrid>
      <StBrands title="Brands" brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))} stylesLabel={(n) => `${n} ${n === 1 ? 'style' : 'styles'}`} />
      <StReviews title="What Runners Say" verifiedLabel="Verified buyer" reviews={DEMO_REVIEWS} />
      <StFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />

      <section className="bg-[var(--st-mint)]">
        <div className="st-wrap flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase">Stay in the know</p>
            <p className="mt-0.5 text-[11px]">New drops, exclusive offers, and restock alerts.</p>
          </div>
          <span className="flex w-full md:max-w-xl">
            <span className="flex-1 bg-white px-4 py-3 text-xs text-neutral-500">Enter your email address</span>
            <span className="bg-[var(--st-navy)] px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Subscribe</span>
          </span>
        </div>
      </section>

      <footer className="bg-[var(--st-footer)] text-white">
        <div className="st-wrap grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-300">
              Premium sneakers.
              <br />
              Authentic style.
              <br />
              For every move you make.
            </p>
          </div>
          {[
            ['Shop', ['New In', 'Men', 'Women', 'Kids', 'Sale']],
            ['Help', ['Help & FAQ', 'Shipping & Delivery', 'Returns & Exchanges', 'Track Order']],
            ['Company', ['About Us', 'Store Locator', 'Contact Us']],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider !text-white">{h as string}</h4>
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
        <p className="border-t border-white/10 py-4 text-center text-[10px] uppercase tracking-wider text-neutral-400">© {new Date().getFullYear()} Stride (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
