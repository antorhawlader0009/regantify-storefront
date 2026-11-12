'use client';

import { useState } from 'react';
import { BadgePercent, Headphones, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { TechzoneCardView } from '../TechzoneCard';
import { TzBrands, TzCategories, TzFeatures, TzHero, TzProductGrid, TzPromoBanners, TzReviews, type TzHeroSlide } from '../TechzoneHome';
import { ArrowRight, BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, DEMO_REVIEWS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <TechzoneCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.badge ? { text: p.badge } : null}
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
  <span className="block text-[26px] font-extrabold leading-none tracking-tight">
    <span className={light ? 'text-white' : 'text-[var(--tz-navy)]'}>Tech</span>
    <span className="text-[var(--tz-brand)]">Zone</span>
  </span>
);

const FEATURE_ICONS = [Truck, ShieldCheck, Headphones, Wallet];
const NAV = ['Home', 'Shop', 'Categories', 'Deals', 'About', 'Contact'];

/**
 * The TechZone template's demo store (Store > Templates > View, for every plan): TechZone's own parts filled with sample
 * electronics and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so TechZone's colours and fonts apply.
 */
export function TechzoneDemo() {
  const slides: TzHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="techzone" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>TechZone</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--tz-navy)] text-white">
        <div className="tz-wrap flex items-center justify-center py-2 text-[11px] sm:justify-between">
          <span className="flex items-center gap-2">
            <Truck size={14} /> Free shipping on orders over ৳5,000
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <BadgePercent size={14} /> Up to 40% off on selected items
          </span>
          <span className="hidden items-center gap-2 md:flex">
            <ShieldCheck size={14} /> 2 years warranty on all products
          </span>
        </div>
      </div>

      <header className="border-b border-slate-100 bg-white">
        <div className="tz-wrap flex h-16 items-center gap-4 lg:gap-8">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <span className="shrink-0">
            <Logo />
          </span>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`relative flex h-16 items-center text-[13px] font-medium ${i === 0 ? 'text-[var(--tz-brand)]' : 'text-slate-700'}`}>
                {l}
                {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--tz-brand)]" />}
              </span>
            ))}
          </nav>
          <span className="relative ml-auto hidden h-10 w-full max-w-[280px] items-center rounded-full border border-blue-300 bg-blue-50 pl-9 pr-4 text-xs text-slate-500 md:flex">
            <SearchIcon className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--tz-brand)]" />
            Search for products...
          </span>
          <div className="ml-auto flex items-center gap-4 md:ml-0">
            <UserIcon className="h-[22px] w-[22px]" />
            <span className="relative">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--tz-brand)] px-1 text-[9px] font-bold text-white">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--tz-brand)] px-1 text-[9px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <TzHero slides={slides} shopLabel="Shop Now" plainImage />
      <TzCategories exploreLabel="Shop now" plainImage title="Shop by category" viewAllLabel="View All Categories" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <TzProductGrid id="featured" title="Best Sellers" sub="Top rated products loved by our customers" viewAllLabel="View Best Sellers" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </TzProductGrid>
      <TzProductGrid title="Recommended for You" sub="Hand-picked products you might like" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(8, 12).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </TzProductGrid>
      <TzPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <TzBrands title="Our Trusted Brands" brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))} />
      <TzFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />
      <TzReviews title="What Our Customers Say" verifiedLabel="Verified buyer" reviews={DEMO_REVIEWS} />

      <footer className="bg-[var(--tz-footer)] text-white">
        <div className="tz-wrap grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
          <div>
            <Logo light />
            <span className="mt-1 block text-[10px] text-slate-300">Smart Tech. Better Life.</span>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold !text-white">Quick Links</h3>
            {['Home', 'Shop', 'About Us', 'Contact'].map((l) => (
              <span key={l} className="block py-1 text-[12px] text-slate-300">
                {l}
              </span>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold !text-white">Categories</h3>
            {['Smartphones', 'Laptops', 'Audio', 'Gaming', 'Smart Home'].map((l) => (
              <span key={l} className="block py-1 text-[12px] text-slate-300">
                {l}
              </span>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold !text-white">Newsletter</h3>
            <p className="mb-3 text-[11px] text-slate-300">Subscribe to get the latest updates and offers.</p>
            <span className="flex overflow-hidden rounded-md border border-white/20 bg-[var(--tz-navy-800)]">
              <span className="flex h-10 min-w-0 flex-1 items-center px-3 text-xs text-slate-400">Your email address</span>
              <span className="flex w-12 items-center justify-center bg-[var(--tz-brand)]">
                <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 pb-20 text-center text-[10px] text-slate-300 sm:pb-4">© {new Date().getFullYear()} TechZone (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
