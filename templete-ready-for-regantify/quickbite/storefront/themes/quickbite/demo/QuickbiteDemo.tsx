'use client';

import { useState } from 'react';
import { Headphones, Heart, Leaf, Menu, Search, ShieldCheck, ShoppingCart, User, UtensilsCrossed, Zap } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { QuickbiteCardView } from '../QuickbiteCard';
import { QbCategories, QbFeatures, QbHero, QbProductGrid, QbPromoBanners, type QbHeroSlide } from '../QuickbiteHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <QuickbiteCardView
      href="#"
      name={p.name}
      subtitle={p.desc}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%`, color: '#C9831F' } : null}
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
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--qb-brand)] text-white">
      <UtensilsCrossed size={20} />
    </span>
    <span className={`text-2xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>QuickBite</span>
  </span>
);
const NAV = ['Home', 'Products', 'Categories', 'About', 'Contact'];
const FEATURE_ICONS = [Zap, ShieldCheck, Headphones, Leaf];

/**
 * The Quickbite template's demo store (Store > Templates > View, for every plan): Quickbite's own parts filled with the template's
 * sample dishes and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Quickbite's colours and fonts apply.
 */
export function QuickbiteDemo() {
  const slides: QbHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="quickbite" className="min-h-screen text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Quickbite</b>. Sample dishes and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#FFF3DD]/90 shadow-[0_4px_24px_rgba(120,70,10,0.08)]">
        <div className="qb-wrap flex h-[72px] items-center justify-between gap-4">
          <Menu size={22} className="lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`relative py-1 text-sm font-medium ${i === 0 ? 'text-ink' : 'text-ink/70'}`}>
                {l}
                {i === 0 && <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded bg-[var(--qb-brand)]" />}
              </span>
            ))}
          </nav>
          <span className="qb-glass-soft hidden w-56 items-center gap-2 rounded-full px-4 py-2 text-sm text-ink/40 md:flex xl:w-72">
            <Search size={16} className="text-ink/50" /> Search burgers, pizza, sushi…
          </span>
          <div className="flex items-center gap-3 sm:gap-4">
            <Search size={20} className="md:hidden" />
            <Heart size={20} className="hidden sm:block" />
            <User size={20} className="hidden sm:block" />
            <span className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--qb-brand)] px-1 text-[10px] font-bold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <QbHero slides={slides} shopLabel="Order Now" exploreLabel="See the menu" exploreHref="#categories" plainImage />
      <QbCategories exploreLabel="Shop Now" title="Browse by Category" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <QbProductGrid id="featured" title="Popular Products" sub="Delivering to Dhaka" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </QbProductGrid>
      <QbProductGrid title="Today's Deals" sub="Grab these tasty offers before they're gone" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(4).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </QbProductGrid>
      <QbPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <QbFeatures
        title="Why order with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.5} />, title: f.title, text: f.text };
        })}
      />

      <footer className="mt-6 border-t border-white/10 bg-[#2A211A] text-white">
        <div className="qb-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-3 text-sm text-white/70">Good Food. Good Mood.</p>
          </div>
          {[
            { title: 'Quick Links', links: ['Home', 'Products', 'About', 'Contact'] },
            { title: 'Customer Care', links: ['Track Order', 'FAQs', 'Delivery Info', 'Refunds'] },
            { title: 'Contact', links: ['hello@quickbite.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} QuickBite (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
