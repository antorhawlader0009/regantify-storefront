'use client';

import { useState } from 'react';
import { BadgeCheck, Headset, Heart, Leaf, MapPin, Menu, Search, User } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { EvernestCardView } from '../EvernestCard';
import { EvCategories, EvFeatures, EvHero, EvProductGrid, EvPromoBanners, type EvHeroSlide } from '../EvernestHome';
import { DEMO_CATEGORIES, DEMO_FEATURES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  return (
    <EvernestCardView
      href="#"
      name={p.name}
      subtitle={`${p.location} · ${p.meta}`}
      image={p.image}
      plainImage
      price={p.price}
      badge={{ text: p.status, color: p.status === 'For Sale' ? '#46682d' : '#d97706' }}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{ label: 'View Details' }}
    />
  );
}

const Wordmark = ({ light = false }: { light?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ev-brand)] text-white">
      <Leaf size={20} />
    </span>
    <span className={`font-display text-[26px] font-semibold ${light ? 'text-white' : 'text-[#24361a]'}`}>Evernest</span>
  </span>
);
const NAV = ['Home', 'Buy', 'Rent', 'Land', 'Properties', 'About Us', 'Contact'];
const FEATURE_ICONS = [BadgeCheck, User, MapPin, Headset];

/**
 * The Evernest template's demo store (Store > Templates > View, for every plan): Evernest's own parts filled with the template's
 * sample listings and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons only
 * show what they do. Wrapped in data-theme / data-skin so Evernest's colours and fonts apply.
 */
export function EvernestDemo() {
  const slides: EvHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="evernest" className="min-h-screen bg-[#f7f7f0] text-[#24361a]">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Evernest</b>. Sample listings and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e6ecda]/70 bg-[#f7f7f0]/95">
        <div className="ev-wrap flex items-center justify-between gap-4 py-3">
          <Menu size={24} className="lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main">
            {NAV.map((l, i) => (
              <span key={l} className={`relative text-sm font-medium ${i === 0 ? 'text-[var(--ev-brand)]' : ''}`}>
                {l}
                {i === 0 && <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[var(--ev-brand)]" />}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full">
              <Search size={18} />
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full">
              <Heart size={18} />
            </span>
            <span className="flex h-10 items-center gap-2 rounded-full bg-[#e6ecda] px-3 text-sm font-medium xl:px-4">
              <User size={18} />
              <span className="hidden xl:inline">Profile</span>
            </span>
          </div>
        </div>
      </header>

      <EvHero slides={slides} shopLabel="Explore Homes" plainImage />
      <EvPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <EvCategories exploreLabel="Browse" title="Find Properties That Fit Your Lifestyle" viewAllLabel="View All Categories" viewAllHref="#featured" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <EvProductGrid id="featured" title="Featured Homes" viewAllLabel="View All Properties" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </EvProductGrid>
      <EvFeatures
        title="Why Choose Evernest"
        items={DEMO_FEATURES.map((f, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
          return { key: f.key, icon: <Icon strokeWidth={1.6} />, title: f.title, text: f.text };
        })}
      />

      <footer className="bg-[#24361a] text-white">
        <div className="ev-wrap pt-14">
          <div className="rounded-3xl bg-gradient-to-r from-[#a9d27d] to-[#cddab6] p-6 text-[#24361a]">
            <h3 className="font-display text-xl font-semibold">Get the latest listings in your inbox</h3>
            <p className="mt-1 text-sm text-[#24361a]/70">New properties, price drops and market tips across Bangladesh.</p>
          </div>
        </div>
        <div className="ev-wrap grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-[240px] text-sm text-white/70">Sustainable, nature-surrounded homes made for peaceful and healthy living.</p>
          </div>
          {[
            { title: 'Explore', links: ['Buy', 'Rent', 'Land', 'About Us'] },
            { title: 'Support', links: ['Contact Us', 'FAQ', 'Privacy', 'Terms'] },
            { title: 'Contact', links: ['hello@evernest.example', '+880 1234 567890', 'Dhaka, Bangladesh'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-[#a9d27d]">{col.title}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} Evernest Homes (sample). All rights reserved.</p>
      </footer>
    </div>
  );
}
