'use client';

import { useState } from 'react';
import { Headphones, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { ChronicsCardView } from '../ChronicsCard';
import { CrBrands, CrCategories, CrFeatures, CrHero, CrProductGrid, CrPromoBanners, type CrHeroSlide } from '../ChronicsHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <ChronicsCardView
      href="#"
      name={p.name}
      subtitle={p.category}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%` } : null}
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

const Logo = ({ light = false }: { light?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className="relative flex h-10 w-9 items-end justify-center rounded-lg bg-[var(--cr-brand)]">
      <span className="absolute -top-2 h-4 w-5 rounded-t-full border-[3px] border-b-0 border-[var(--cr-brand)]" />
      <span className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[var(--cr-brand)]">C</span>
    </span>
    <span className="text-left leading-tight">
      <span className={`block text-[20px] font-extrabold tracking-tight sm:text-[22px] ${light ? 'text-white' : 'text-ink'}`}>Chronics</span>
      <span className={`block text-[10px] ${light ? 'text-white/60' : 'text-ink/60'}`}>Style, Your Way</span>
    </span>
  </span>
);

const NAV = ['HOME', 'SHOP', 'WOMEN', 'MEN', 'ACCESSORIES', 'BIG OFFERS'];
const STRIP = ["WOMEN'S TOP", "WOMEN'S WEAR", 'SUNGLASSES', 'SHOES STORE', 'BAGS STORE', 'JEWELRY STORE'];

/**
 * The Chronics template's demo store (Store > Templates > View, for every plan): Chronics' own parts filled with the
 * template's sample fashion products and photos, so a seller sees the design before picking it. Nothing here reads or
 * changes a store; buttons only show what they do. Wrapped in data-theme / data-skin so Chronics' colours and fonts apply.
 */
export function ChronicsDemo() {
  const slides: CrHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="chronics" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Chronics</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--cr-violet)] text-[10px] text-white sm:text-[11px]">
        <div className="cr-wrap flex h-9 items-center justify-between gap-4">
          <span className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Truck size={14} className="text-yellow-300" /> Free Shipping on Orders Over ৳6,000
            </span>
            <span className="hidden items-center gap-2 md:flex">
              <RotateCcw size={14} /> Easy 30-Day Returns
            </span>
          </span>
          <span className="flex items-center gap-2 font-medium">
            <Phone size={14} /> <span className="hidden sm:inline">+880 1234 567890</span>
          </span>
        </div>
      </div>

      <header className="border-b border-gray-100 bg-white">
        <div className="cr-wrap flex h-[64px] items-center justify-between sm:h-[72px]">
          <Logo />
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
            {NAV.map((label, i) => (
              <span key={label} className={`relative py-6 text-[11px] font-medium tracking-wide ${i === 0 ? 'text-[var(--cr-brand)]' : 'text-ink'}`}>
                {label}
                {i === 0 && <span className="absolute inset-x-0 bottom-3 h-[2px] rounded bg-[var(--cr-brand)]" />}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <SearchIcon className="h-[19px] w-[19px]" />
            <span className="relative">
              <HeartIcon className="h-[19px] w-[19px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cr-brand)] px-1 text-[9px] font-semibold text-white">2</span>
            </span>
            <UserIcon className="h-[19px] w-[19px]" />
            <span className="relative">
              <BagIcon className="h-[19px] w-[19px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cr-brand)] px-1 text-[9px] font-semibold text-white">3</span>
            </span>
            <MenuIcon className="h-[22px] w-[22px] lg:hidden" />
          </div>
        </div>
      </header>
      <div className="hidden border-b border-gray-100 bg-white lg:block">
        <ul className="cr-wrap flex h-[48px] items-center gap-8">
          {STRIP.map((label) => (
            <li key={label} className="text-[10px] font-medium text-ink/80">
              {label}
            </li>
          ))}
        </ul>
      </div>

      <CrHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <CrCategories exploreLabel="Shop Now" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <CrProductGrid id="featured" title="Trending Products" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </CrProductGrid>
      <CrFeatures
        title="Why Shop With Us?"
        items={[
          { key: '1', icon: <Truck strokeWidth={1.6} />, title: 'Free Worldwide Shipping', text: 'On orders over ৳6,000' },
          { key: '2', icon: <RotateCcw strokeWidth={1.6} />, title: '30-Day Return Policy', text: 'No hassle returns' },
          { key: '3', icon: <ShieldCheck strokeWidth={1.6} />, title: 'Secure Payment', text: '100% secure checkout' },
          { key: '4', icon: <Headphones strokeWidth={1.6} />, title: '24/7 Customer Support', text: "We're here to help" },
        ]}
      />
      <CrPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <CrProductGrid title="New Arrivals" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </CrProductGrid>
      <CrBrands
        title="Top Brands"
        allLabel="View all"
        allHref="#featured"
        brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))}
        stylesLabel={(n) => `${n} ${n === 1 ? 'style' : 'styles'}`}
      />

      <footer className="bg-[var(--cr-footer)] text-white">
        <div className="cr-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="inline-block rounded-xl bg-white p-3">
              <Logo />
            </span>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/70">Fresh fashion for every day. Style, your way.</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Shop</h3>
            {["Women's Wear", "Men's Wear", 'Accessories', 'Big Offers'].map((l) => (
              <span key={l} className="block py-1 text-[13px] text-white/70">
                {l}
              </span>
            ))}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Contact</h3>
            <span className="flex items-center gap-2 py-1 text-[13px] text-white/70">
              <Phone size={14} /> +880 1234 567890
            </span>
            <span className="flex items-center gap-2 py-1 text-[13px] text-white/70">
              <Mail size={14} /> hello@chronics.example
            </span>
            <span className="flex items-center gap-2 py-1 text-[13px] text-white/70">
              <MapPin size={14} /> Dhaka, Bangladesh
            </span>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Newsletter</h3>
            <p className="text-[13px] text-white/70">Get 40% off your first order.</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 pb-20 text-center text-[12px] text-white/50 sm:pb-4">© {new Date().getFullYear()} Chronics (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
