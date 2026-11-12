'use client';

import { useState } from 'react';
import { Award, Gift, ShieldCheck, Tag, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { VaeloraCardView } from '../VaeloraCard';
import { VaBrands, VaCategories, VaFeatures, VaHero, VaProductGrid, VaPromoBanners, VaReviews, type VaHeroSlide } from '../VaeloraHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, DEMO_REVIEWS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;
const serif = { fontFamily: 'var(--font-cormorant), Georgia, serif' } as const;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <VaeloraCardView
      href="#"
      name={p.name}
      subtitle={p.category}
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
  <span className={`block text-[32px] font-medium uppercase leading-none tracking-[0.12em] ${light ? 'text-white' : 'text-black'}`} style={serif}>
    Vaelora
  </span>
);

const FEATURE_ICONS = [Award, ShieldCheck, Truck, Gift];
const NAV = ['New Arrivals', 'Collections', 'Best Sellers'];

/**
 * The Vaelora template's demo store (Store > Templates > View, for every plan): Vaelora's own parts filled with sample watches
 * and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only show what they
 * do. Wrapped in data-theme / data-skin so Vaelora's colours and fonts apply.
 */
export function VaeloraDemo() {
  const slides: VaHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="vaelora" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Vaelora</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-black text-[11px] uppercase text-white">
        <div className="va-wrap flex h-9 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <span className="flex items-center gap-2 truncate">
              <Truck size={16} /> Free shipping on orders over ৳50,000
            </span>
            <span className="hidden items-center gap-2 md:flex">
              <Tag size={16} /> 10% off your first order | Code: <b className="font-medium text-[var(--va-gold-light)]">VAEL10</b>
            </span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <span>Help &amp; FAQ</span>
            <span>Track order</span>
          </div>
        </div>
      </div>

      <header className="border-b border-neutral-200 bg-white">
        <div className="va-wrap flex h-[68px] items-center justify-between gap-4 sm:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Logo />
          <nav className="hidden min-w-0 flex-1 items-center gap-5 lg:ml-6 lg:flex xl:ml-10 xl:gap-8" aria-label="Main">
            {NAV.map((l) => (
              <span key={l} className="text-[11px] font-medium uppercase tracking-wider">
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden w-44 items-center gap-2 border border-neutral-300 px-3 py-2 text-xs text-neutral-500 lg:flex xl:w-60">
              <SearchIcon className="h-4 w-4" /> Search products…
            </span>
            <UserIcon className="hidden h-5 w-5 sm:block" />
            <span className="relative">
              <HeartIcon className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--va-brand)] px-1 text-[9px] text-white">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <VaHero slides={slides} shopLabel="Shop new in" exploreLabel="Explore collections" exploreHref="#featured" plainImage />
      <VaCategories exploreLabel="Shop now" plainImage title="Shop by category" viewAllLabel="View all" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <VaProductGrid id="featured" title="Signature pieces" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </VaProductGrid>
      <VaPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <VaProductGrid title="Maison selection" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </VaProductGrid>
      <VaBrands title="Our collections" brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured' }))} />
      <VaFeatures
        title="The Vaelora promise"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.3} />, title: f.title, text: f.text };
        })}
      />
      <VaReviews title="Client stories" verifiedLabel="Verified buyer" reviews={DEMO_REVIEWS} />

      <footer className="mt-16 bg-[var(--va-footer)] text-white">
        <div className="va-wrap grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 text-[11px] text-neutral-400">
              The art of quiet luxury.
              <br />
              Crafted to be with you, always.
            </p>
          </div>
          {[
            ['Shop', ['New Arrivals', 'Men', 'Women', 'Collections']],
            ['Customer care', ['Contact us', 'Book an appointment', 'Shipping & delivery', 'Returns & exchanges']],
            ['About us', ['Our story', 'Craftsmanship', 'Press']],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider !text-white">{h as string}</h4>
              <ul className="mt-4 space-y-2.5">
                {(ls as string[]).map((x) => (
                  <li key={x} className="text-[11px] text-neutral-400">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <p className="va-wrap py-4 text-[10px] uppercase text-neutral-400">© {new Date().getFullYear()} Vaelora (sample). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
