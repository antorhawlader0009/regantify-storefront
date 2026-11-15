'use client';

import { useState } from 'react';
import { BadgePercent, Crown, Gift, Headphones, Mail, MapPin, Phone } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { MenauraCardView } from '../MenauraCard';
import { MnCategories, MnFeatures, MnHero, MnProductGrid, MnPromoBanners, type MnHeroSlide } from '../MenauraHome';
import { BagIcon, FacebookIcon, HeartIcon, InstagramIcon, MenuIcon, SearchIcon, UserIcon, YoutubeIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <MenauraCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%`, tone: 'sale' } : p.isNew ? { text: 'New' } : null}
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
  <span className="inline-flex flex-col leading-none">
    <span className="font-display text-[26px] font-medium tracking-wide">
      MENAURA
    </span>
  </span>
);

/**
 * The Menaura template's demo store (Store > Templates > View, for every plan): Menaura's own parts filled with the template's
 * sample fashion products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Menaura's colours and fonts apply.
 */
export function MenauraDemo() {
  const slides: MnHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="menaura" className="min-h-screen bg-[var(--mn-cream)] text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Menaura</b>. Sample products and pictures; your store shows your own.
      </div>

      <header className="sticky top-0 z-40 bg-[var(--mn-cream)]/90 backdrop-blur">
        <div className="mn-wrap flex h-[64px] items-center justify-between gap-3 sm:h-[72px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
            {['Home', 'Shop', 'Deals', 'About Us', 'Blog', 'Contact'].map((label, i) => (
              <span key={label} className={`border-b-2 py-1 text-sm font-medium ${i === 0 ? 'border-[var(--mn-brand)] text-[var(--mn-brand)]' : 'border-transparent'}`}>
                {label}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <span className="rounded-full p-2">
              <SearchIcon className="h-[22px] w-[22px]" />
            </span>
            <span className="rounded-full p-2">
              <UserIcon className="h-[22px] w-[22px]" />
            </span>
            <span className="relative rounded-full p-2">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--mn-brand)] px-1 text-[10px] font-medium text-white">2</span>
            </span>
            <span className="relative rounded-full p-2">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--mn-brand)] px-1 text-[10px] font-medium text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <MnHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <MnCategories
        exploreLabel="Explore Now"
        title="Shop by Category"
        viewAllLabel="View All Categories"
        viewAllHref="#categories"
        plainImage
        items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image, count: c.count }))}
      />
      <MnProductGrid id="featured" title="New Arrivals" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </MnProductGrid>
      <MnPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <MnFeatures
        title="Why Shop With Us?"
        items={[
          { key: '1', icon: <Gift strokeWidth={1.6} />, title: 'Exclusive Offers', text: 'Save more every day' },
          { key: '2', icon: <BadgePercent strokeWidth={1.6} />, title: 'Secure Payments', text: '100% safe & secure' },
          { key: '3', icon: <Headphones strokeWidth={1.6} />, title: '24/7 Support', text: "We're here to help" },
          { key: '4', icon: <Crown strokeWidth={1.6} />, title: 'Loyalty Rewards', text: 'Earn points & get rewards' },
        ]}
      />

      <footer className="mt-10 bg-[var(--mn-footer)] text-white/80">
        <div className="mn-wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.6fr]">
          <div>
            <span className="inline-block rounded-xl bg-[var(--mn-cream)] p-3 text-ink">
              <Wordmark />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">Modern menswear for every occasion. Timeless pieces, thoughtfully made.</p>
            <div className="mt-5 flex gap-3">
              {[FacebookIcon, InstagramIcon, YoutubeIcon].map((Icon, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          {[
            { title: 'Shop', links: ['Casual Wear', 'Formal Wear', 'Street Style', 'Outerwear', 'Accessories'] },
            { title: 'Company', links: ['About Us', 'Blog', 'Contact', 'Deals'] },
            { title: 'Account', links: ['My Account', 'Wishlist', 'Cart', 'All Products'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-medium text-white">{col.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-4 text-sm font-medium text-white">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--mn-brand)]" /> Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--mn-brand)]" /> +880 1234 567890
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--mn-brand)]" /> hello@menaura.example
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 pb-20 text-center text-xs sm:pb-5">© {new Date().getFullYear()} Menaura (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
