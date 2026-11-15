'use client';

import { useState } from 'react';
import { BadgePercent, Crown, Gift, Headphones, Mail, MapPin, Phone } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { BeloraCardView } from '../BeloraCard';
import { BeCategories, BeFeatures, BeHero, BeProductGrid, BePromoBanners, type BeHeroSlide } from '../BeloraHome';
import { BagIcon, FacebookIcon, HeartIcon, InstagramIcon, MenuIcon, SearchIcon, UserIcon, YoutubeIcon } from '../icons';
import { DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <BeloraCardView
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

const Wordmark = () => <span className="font-display text-[28px] font-medium uppercase tracking-[0.12em] text-[var(--be-brand)]">Belora</span>;

/**
 * The Belora template's demo store (Store > Templates > View, for every plan): Belora's own parts filled with the template's
 * sample skincare products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Belora's colours and fonts apply.
 */
export function BeloraDemo() {
  const slides: BeHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="belora" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Belora</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="bg-[var(--be-brand)] text-[11px] tracking-wider text-white">
        <div className="be-wrap flex items-center justify-center gap-10 py-2">
          <span>FREE SHIPPING ON ORDERS OVER ৳9,000</span>
          <span className="hidden sm:block">GET 10% OFF YOUR FIRST ORDER!</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[var(--be-soft)] bg-white">
        <div className="be-wrap flex h-[64px] items-center justify-between gap-3 sm:h-[72px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main">
            {['Home', 'Shop', 'Skin Care', 'Makeup', 'Hair Care', 'About Us', 'Blog', 'Contact'].map((label, i) => (
              <span key={label} className={`border-b-2 py-6 text-[11px] font-medium uppercase tracking-[0.08em] ${i === 0 ? 'border-[var(--be-brand)] text-[var(--be-brand)]' : 'border-transparent'}`}>
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
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--be-brand)] px-1 text-[10px] font-medium text-white">2</span>
            </span>
            <span className="relative rounded-full p-2">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--be-brand)] px-1 text-[10px] font-medium text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <BeHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage />
      <BeFeatures
        title="Why Belora"
        items={[
          { key: '1', icon: <Gift strokeWidth={1.6} />, title: 'Natural & Safe', text: 'Made with ingredients you can trust' },
          { key: '2', icon: <BadgePercent strokeWidth={1.6} />, title: 'Dermatologically Tested', text: 'Suitable for all skin types' },
          { key: '3', icon: <Headphones strokeWidth={1.6} />, title: 'Premium Quality', text: 'Formulas for visible results' },
          { key: '4', icon: <Crown strokeWidth={1.6} />, title: 'Sustainable Beauty', text: 'Eco-conscious packaging' },
        ]}
      />
      <BeCategories
        exploreLabel="Explore Now"
        title="Shop by Category"
        viewAllLabel="View All Categories"
        viewAllHref="#categories"
        plainImage
        items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image, count: c.count }))}
      />
      <BePromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <BeProductGrid id="featured" title="Best Sellers" viewAllLabel="View All" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </BeProductGrid>

      <footer className="mt-10 border-t border-[var(--be-soft)] bg-white text-neutral-700">
        <div className="be-wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.6fr]">
          <div>
            <span className="inline-block">
              <Wordmark />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">Clean beauty. Conscious choices. Confidence, naturally.</p>
            <div className="mt-5 flex gap-3">
              {[FacebookIcon, InstagramIcon, YoutubeIcon].map((Icon, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center text-[var(--be-brand)]">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          {[
            { title: 'Shop', links: ['Skin Care', 'Makeup', 'Hair Care', 'Bath & Body', 'Gift Sets'] },
            { title: 'Customer Care', links: ['Shipping Policy', 'Return Policy', 'Privacy Policy', 'Track Order'] },
            { title: 'Quick Links', links: ['Home', 'Shop', 'About Us', 'Blog', 'Contact Us'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--be-brand)]">{col.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--be-brand)]">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--be-brand)]" /> Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--be-brand)]" /> +880 1234 567890
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[var(--be-brand)]" /> hello@belora.example
              </li>
            </ul>
          </div>
        </div>
        <div className="px-4 py-5 pb-20 text-center text-[11px] text-neutral-600 sm:pb-5">© {new Date().getFullYear()} Belora (sample). All rights reserved.</div>
      </footer>
    </div>
  );
}
