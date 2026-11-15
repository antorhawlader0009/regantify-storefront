'use client';

import { useState } from 'react';
import { Headset, Heart, Menu, RefreshCw, Search, ShieldCheck, ShoppingCart, Truck, User, UtensilsCrossed } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { TastehouseCardView } from '../TastehouseCard';
import { ThCategories, ThFeatures, ThHero, ThProductGrid, ThPromoBanners, type ThHeroSlide } from '../TastehouseHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <TastehouseCardView
      href="#"
      name={p.name}
      subtitle={p.sub}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={p.badge ?? null}
      rating={{ average: p.rating, count: 120 }}
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

const Wordmark = () => (
  <span className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--th-brand)] text-white">
      <UtensilsCrossed size={18} strokeWidth={2.4} />
    </span>
    <span className="text-[22px] font-extrabold tracking-tight text-ink">TasteHouse</span>
  </span>
);
const NAV = ['Home', 'Menu', 'Categories', 'Offers', 'My Orders', 'Support'];
const FEATURE_ICONS = [Truck, RefreshCw, ShieldCheck, Headset];

/**
 * The Tastehouse template's demo store (Store > Templates > View, for every plan): Tastehouse's own parts filled with the template's
 * sample dishes and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Tastehouse's colours and fonts apply.
 */
export function TastehouseDemo() {
  const slides: ThHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="tastehouse" className="min-h-screen bg-[#FFFBF7] text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Tastehouse</b>. Sample dishes and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 bg-[#FFFBF7]">
        <div className="th-wrap flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
          <Menu size={22} className="lg:hidden" />
          <Wordmark />
          <nav className="mx-auto hidden items-center gap-7 text-[13px] font-medium lg:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={i === 0 ? 'text-[var(--th-brand)]' : 'text-neutral-700'}>
                {l}
              </span>
            ))}
          </nav>
          <span className="ml-auto hidden w-[280px] items-center gap-3 rounded-full bg-[#FBEFE3] py-1.5 pl-5 pr-1.5 text-sm text-neutral-400 md:flex">
            <Search size={16} className="shrink-0 text-neutral-500" />
            <span className="flex-1">Search for dishes…</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--th-brand)] text-white">
              <Search size={16} />
            </span>
          </span>
          <div className="ml-auto flex items-center gap-4 sm:gap-6 md:ml-0">
            <Search size={20} className="md:hidden" />
            <Heart size={20} />
            <span className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--th-brand)] px-1 text-[10px] font-bold text-white">3</span>
            </span>
            <User size={20} className="hidden sm:block" />
          </div>
        </div>
      </header>

      <ThHero slides={slides} shopLabel="Order Now" exploreLabel="Explore Menu" exploreHref="#categories" plainImage />
      <ThFeatures
        title="Why order with us"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.8} />, title: f.title, text: f.text };
        })}
      />
      <ThCategories exploreLabel="Shop Now" title="Explore by Cuisine" viewAllLabel="View All" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <ThProductGrid id="featured" title="Popular Dishes" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </ThProductGrid>
      <ThPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <ThProductGrid title="More to Love" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </ThProductGrid>

      <footer className="mt-14 border-t border-[#f0e6da]">
        <div className="th-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[260px] text-xs leading-relaxed text-neutral-500">Your favorite food, delivered fast to your doorstep. Enjoy a seamless ordering experience.</p>
          </div>
          {[
            { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact Us'] },
            { title: 'Support', links: ['Help Center', 'Track Order', 'Returns', 'FAQs'] },
            { title: 'Contact', links: ['hello@tastehouse.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold">{col.title}</h4>
              <ul className="space-y-2 text-xs text-neutral-500">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-[#f0e6da] py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} TasteHouse (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
