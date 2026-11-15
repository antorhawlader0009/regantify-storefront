'use client';

import { useState } from 'react';
import { ChevronDown, Headphones, Heart, LayoutGrid, Lock, Menu, RotateCcw, Search, ShoppingCart, Truck, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { VivaCardView } from '../VivaCard';
import { VvCategories, VvFeatures, VvHero, VvProductGrid, VvPromoBanners, type VvHeroSlide } from '../VivaHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <VivaCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={taka(p.oldPrice)}
      badge={off > 0 ? { text: `-${off}%`, color: '#ef7b7b' } : null}
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
  <span className="leading-none">
    <span className={`block font-display text-[28px] font-semibold tracking-wide ${light ? 'text-[#e8efd0]' : 'text-[#0d3b2e]'}`}>ViVA</span>
    <span className={`block text-[8px] font-medium tracking-[0.25em] ${light ? 'text-[#e8efd0]' : 'text-[#0d3b2e]'}`}>LIVE BETTER</span>
  </span>
);
const NAV = ['Home', 'Shop', 'Deals', 'New Arrivals', 'Brands', 'Inspiration', 'Track Order'];
const FEATURE_ICONS = [Truck, RotateCcw, Lock, Headphones];

/**
 * The Viva template's demo store (Store > Templates > View, for every plan): Viva's own parts filled with the template's
 * sample products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Viva's colours and fonts apply.
 */
export function VivaDemo() {
  const slides: VvHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, title: s.title, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="viva" className="min-h-screen bg-[var(--vv-cream)] text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Viva</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[#0d3b2e] text-[12px] text-white">
        <div className="vv-wrap flex items-center justify-center divide-x divide-white/25 py-2.5">
          <span className="flex items-center gap-2 px-4 sm:px-8">
            <Truck size={14} className="text-[#d9e1b5]" /> Free Shipping on Orders Over ৳5,900
          </span>
          <span className="hidden items-center gap-2 px-8 sm:flex">
            <RotateCcw size={14} className="text-[#d9e1b5]" /> 30-Day Easy Returns
          </span>
          <span className="hidden items-center gap-2 px-8 sm:flex">
            <Lock size={14} className="text-[#d9e1b5]" /> Secure Payments
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--vv-cream)]">
        <div className="vv-wrap">
          <div className="flex items-center gap-2 py-3 sm:gap-3 lg:gap-8">
            <Menu size={22} className="lg:hidden" />
            <Wordmark />
            <span className="relative ml-auto hidden h-12 w-full max-w-[520px] flex-1 items-stretch overflow-hidden rounded-full border-2 border-[#b9cfa6] bg-white shadow-[var(--shadow-card)] md:flex">
              <span className="flex flex-1 items-center pl-5 text-[13px] text-ink/40">Search products, brands and more…</span>
              <span className="flex w-14 items-center justify-center rounded-full bg-[#0d3b2e] text-white">
                <Search size={18} />
              </span>
            </span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
              <Search size={22} className="mx-2 md:hidden" />
              <User size={22} strokeWidth={1.6} className="mx-2 hidden sm:block" />
              <Heart size={22} strokeWidth={1.6} className="mx-2 hidden sm:block" />
              <span className="relative mx-2">
                <ShoppingCart size={22} strokeWidth={1.6} />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0d3b2e] px-1 text-[9px] font-semibold text-white">3</span>
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-8 pb-3 text-[13px] lg:flex">
            <span className="flex h-10 w-[210px] items-center gap-3 rounded-xl bg-[#0d3b2e] px-5 font-medium text-white">
              <LayoutGrid size={16} /> All Categories <ChevronDown size={14} className="ml-auto" />
            </span>
            {NAV.map((l, i) => (
              <span key={l} className={`relative py-1 ${i === 0 ? 'font-semibold text-[#0d3b2e]' : 'text-ink/80'}`}>
                {l}
                {i === 0 && <span className="absolute -bottom-3 left-0 h-0.5 w-full bg-[#0d3b2e]" />}
              </span>
            ))}
          </div>
        </div>
      </header>

      <VvHero slides={slides} shopLabel="Shop Now" plainImage badge={{ href: '#featured', top: 'UP TO', big: '40%', bottom: 'OFF', cta: 'Shop' }} />
      <VvCategories exploreLabel="Shop Now" title="Shop by Category" viewAllLabel="View All" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <VvProductGrid id="featured" title="Top Picks For You ✦" viewAllLabel="See All Deals" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </VvProductGrid>
      <VvPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <VvProductGrid title="Trending Now" viewAllLabel="See All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </VvProductGrid>
      <VvFeatures
        title="Why shop with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.2} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-8 bg-[#082a20] text-white">
        <div className="vv-wrap grid gap-8 pb-8 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-[220px] text-[11px] leading-relaxed text-white/75">Your one-stop shop for quality products across every category. Live better with Viva.</p>
          </div>
          {[
            { title: 'Shop', links: ['New Arrivals', 'Deals', 'Electronics', 'Fashion'] },
            { title: 'Support', links: ['Contact Us', 'Shipping', 'Returns', 'FAQ'] },
            { title: 'Contact', links: ['hello@viva.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[13px] font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-[12px] text-white/75">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-[11px] text-white/60">© {new Date().getFullYear()} Viva (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
