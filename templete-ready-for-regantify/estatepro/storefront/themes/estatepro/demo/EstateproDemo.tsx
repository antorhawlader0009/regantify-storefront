'use client';

import { useState } from 'react';
import { CheckCircle2, Headset, Heart, Home, MapPin, Menu, Search, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { EstateproCardView } from '../EstateproCard';
import { EpCategories, EpFeatures, EpHero, EpProductGrid, EpPromoBanners, type EpHeroSlide } from '../EstateproHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  return (
    <EstateproCardView
      href="#"
      name={p.name}
      subtitle={`${p.location} · ${p.meta}`}
      image={p.image}
      plainImage
      price={p.price}
      badge={{ text: p.status, color: p.status === 'For Sale' ? '#059669' : '#2563EB' }}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{ label: 'View Details' }}
    />
  );
}

const Wordmark = () => (
  <span className="flex items-center gap-2.5">
    <span className="grid h-11 w-11 place-items-center rounded-lg border-2 border-[var(--ep-brand)] text-[var(--ep-brand)]">
      <Home size={26} />
    </span>
    <span className="leading-tight">
      <span className="block text-xl font-bold text-white">
        Estate<span className="text-[var(--ep-brand)]">Pro</span>
      </span>
      <span className="block text-[11px] text-white/80">Find. Invest. Live Better</span>
    </span>
  </span>
);
const NAV = ['Home', 'For Rent', 'For Sale', 'Properties', 'About', 'Contact'];
const FEATURE_ICONS = [CheckCircle2, User, MapPin, Headset];

/**
 * The Estatepro template's demo store (Store > Templates > View, for every plan): Estatepro's own parts filled with the template's
 * sample listings and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Estatepro's colours and fonts apply.
 */
export function EstateproDemo() {
  const slides: EpHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="estatepro" className="min-h-screen bg-[#FDF8EE] text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg ring-1 ring-white/10">
        Template preview: <b>Estatepro</b>. Sample listings and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 bg-black/90">
        <div className="ep-wrap flex items-center justify-between gap-4 py-3 lg:py-4">
          <Menu size={24} className="text-white lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`border-b-2 pb-1 text-sm ${i === 0 ? 'border-[var(--ep-brand)] text-[var(--ep-brand)]' : 'border-transparent text-white'}`}>
                {l}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/70 text-[var(--ep-brand)] ring-1 ring-white/10">
              <Search size={20} />
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/70 text-[var(--ep-brand)] ring-1 ring-white/10">
              <Heart size={20} />
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[var(--ep-brand)] px-3.5 py-2.5 text-sm font-semibold text-ink shadow-lg xl:px-5">
              <User size={18} />
              <span className="hidden xl:inline">My Profile</span>
            </span>
          </div>
        </div>
      </header>

      <EpHero slides={slides} shopLabel="Browse Properties" exploreLabel="Contact Us" exploreHref="#contact" plainImage />
      <EpCategories exploreLabel="Browse" title="Find Properties That Fit Your Lifestyle" viewAllLabel="View All Categories" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <EpFeatures
        title="Your Trusted Real Estate Partner"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.6} />, title: f.title, text: f.text };
        })}
      />
      <EpProductGrid id="featured" title="Handpicked Just for You" viewAllLabel="View All Properties" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </EpProductGrid>
      <EpPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#contact' }))} />

      <footer id="contact" className="bg-[#111] text-white">
        <div className="ep-wrap pt-14">
          <div className="flex flex-col gap-5 rounded-2xl bg-gradient-to-r from-[#F2C468] to-[#F8DC9B] p-6 text-ink md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold">Get the latest listings in your inbox</h3>
              <p className="mt-1 text-sm text-ink/70">New properties, price drops and market tips across Bangladesh.</p>
            </div>
          </div>
        </div>
        <div className="ep-wrap grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[240px] text-sm text-white/70">Premium properties in top locations across Bangladesh.</p>
          </div>
          {[
            { title: 'Explore', links: ['For Rent', 'For Sale', 'Properties', 'About'] },
            { title: 'Support', links: ['Contact Us', 'FAQ', 'Privacy', 'Terms'] },
            { title: 'Contact', links: ['hello@estatepro.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-[var(--ep-brand)]">{col.title}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} EstatePro (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
