'use client';

import { useState } from 'react';
import { BadgeCheck, Gem, Headset, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { PmTopBarView } from '../PlaymateTopBar';
import { PlaymateCardView } from '../PlaymateCard';
import { PmBrands, PmCategories, PmFeatures, PmHero, PmProductRow, PmPromoBanners, type PmHeroSlide } from '../PlaymateHome';
import { CartIcon, ChevronDown, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMO_IMAGES, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <PlaymateCardView
      href="#"
      name={p.name}
      subtitle={p.subtitle}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={taka(p.oldPrice)}
      badge={p.isNew ? { text: 'New' } : { text: `-${off}%`, tone: 'sale' }}
      rating={{ average: p.rating, count: p.reviews }}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to Cart',
        doneLabel: 'Added',
        done: added,
        onClick: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        },
      }}
    />
  );
}

/**
 * The PlayMate template's demo store (Store > Templates > View, for every plan): PlayMate's own parts filled with the
 * template's sample toys and photos, so a seller sees the design before picking it. Nothing here reads or changes a
 * store; buttons only show what they do. Wrapped in data-theme / data-skin so PlayMate's colours and fonts apply.
 */
export function PlaymateDemo() {
  const slides: PmHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({
    key: s.title1,
    image: s.image,
    kicker: 'Play. Learn. Grow.',
    title1: s.title1,
    title2: s.title2,
    accent: s.accent,
    text: s.text,
    alt: s.alt,
    href: '#best-sellers',
  }));
  const best = DEMO_PRODUCTS.filter((p) => p.bestSeller);
  const newArrivals = DEMO_PRODUCTS.filter((p) => p.isNew);
  const iconCls = 'h-7 w-7';
  return (
    <div data-theme="storepal" data-skin="playmate" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label in the corner. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>PlayMate</b>. Sample products and pictures; your store shows your own.
      </div>

      <PmTopBarView
        closeKey="playmate-demo-topbar-closed"
        closeLabel="Close announcement bar"
        messages={[
          <>Free delivery on orders over ৳5,000</>,
          <>
            10% off your first order <span className="mx-1 opacity-60">|</span> Use code: <b className="text-[var(--pm-yellow)]">TOY10</b>
          </>,
          <>Easy returns within 7 days</>,
        ]}
      />

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="pm-wrap flex h-[66px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MenuIcon className="h-6 w-6 lg:hidden" />
            <span className="flex flex-col leading-none">
              <span className="text-[26px] font-extrabold tracking-tight">
                <span className="text-accent">Play</span>
                <span className="text-[var(--pm-blue)]">Mate</span>
              </span>
              <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.35em] text-accent/70">Toy Store</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide">
              Shop by Category <ChevronDown className="h-3.5 w-3.5" />
            </span>
            {['Brands', 'Best Sellers', 'New Arrivals'].map((label) => (
              <span key={label} className="text-[12px] font-semibold uppercase tracking-wide">
                {label}
              </span>
            ))}
            <span className="text-[12px] font-semibold uppercase tracking-wide text-red-600">Sale</span>
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full">
              <SearchIcon className="h-[22px] w-[22px]" />
            </span>
            <span className="hidden h-10 w-10 place-items-center rounded-full sm:grid">
              <UserIcon className="h-[22px] w-[22px]" />
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full">
              <HeartIcon className="h-[22px] w-[22px]" />
            </span>
            <span className="relative grid h-10 w-10 place-items-center rounded-full">
              <CartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">2</span>
            </span>
          </div>
        </div>
      </header>

      <PmHero slides={slides} shopLabel="Shop Now" exploreLabel="Explore Collection" exploreHref="#categories" plainImage badge={{ big: ['BEST', 'TOYS'], small: ['FOR HAPPY', 'KIDS'] }} />
      <PmFeatures
        items={[
          { key: '1', icon: <Truck className={iconCls} strokeWidth={1.5} />, title: 'Fast Delivery', text: 'All over Bangladesh' },
          { key: '2', icon: <ShieldCheck className={iconCls} strokeWidth={1.5} />, title: 'Secure Payment', text: '100% Safe & Secure' },
          { key: '3', icon: <Gem className={iconCls} strokeWidth={1.5} />, title: 'Premium Quality', text: 'Safe & Non-Toxic' },
          { key: '4', icon: <BadgeCheck className={iconCls} strokeWidth={1.5} />, title: 'Cash on Delivery', text: 'Pay when it arrives' },
          { key: '5', icon: <Headset className={iconCls} strokeWidth={1.5} />, title: 'Customer Support', text: "We're Here to Help" },
        ]}
      />
      <PmCategories title="Shop by Category" shopLabel="Shop Now" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#best-sellers', image: c.image }))} />
      <PmProductRow id="best-sellers" title="Best Sellers" viewAllLabel="View All" viewAllHref="#best-sellers">
        {best.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PmProductRow>
      <PmPromoBanners
        plainImage
        banners={[
          { key: 'sale', kicker: 'Limited Time Offer', title: 'Up to 20% off', text: 'On selected toys', cta: 'Shop Deals', href: '#best-sellers', image: DEMO_PROMO_IMAGES.robot },
          { key: 'new', kicker: 'New Arrivals', title: 'The latest toys for every kid', cta: 'Shop New Arrivals', href: '#new-arrivals', image: DEMO_PROMO_IMAGES.dino },
        ]}
      />
      <PmProductRow id="new-arrivals" title="New Arrivals" viewAllLabel="View All" viewAllHref="#new-arrivals">
        {newArrivals.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </PmProductRow>
      <PmBrands title="Top Brands" brands={DEMO_BRANDS.map((name) => ({ name, href: '#best-sellers' }))} />

      <footer className="bg-accent-light">
        <div className="pm-wrap grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-3 lg:grid-cols-[1.35fr_0.8fr_1fr_0.9fr_1.35fr] lg:gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <span className="text-[26px] font-extrabold tracking-tight">
              <span className="text-accent">Play</span>
              <span className="text-[var(--pm-blue)]">Mate</span>
            </span>
            <p className="mt-4 max-w-[230px] text-[12px] leading-relaxed text-ink/80">
              Fun, safe and educational toys for kids of all ages. Play more, learn more, grow more!
            </p>
          </div>
          {[
            { title: 'Shop', links: ['All Toys', ...DEMO_CATEGORIES.slice(0, 5).map((c) => c.name)] },
            { title: 'Customer Service', links: ['Track Order', 'Delivery Policy', 'Return & Refund', 'FAQ', 'Contact Us'] },
            { title: 'Company', links: ['About Us', 'Magazine', 'Privacy Policy', 'Terms & Conditions'] },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-bold uppercase tracking-wide">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l} className="text-[12px] text-ink/80">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="col-span-2 grid gap-4 sm:grid-cols-2 md:col-span-3 md:grid-cols-4 lg:col-span-1 lg:block lg:space-y-4 lg:border-l lg:border-ink/10 lg:pl-8">
            {[
              { Icon: Truck, title: 'Fast Delivery', text: 'All over Bangladesh' },
              { Icon: RefreshCw, title: 'Easy Returns', text: 'Within 7 days' },
              { Icon: ShieldCheck, title: 'Secure Payment', text: '100% Safe & Secure' },
              { Icon: Headset, title: 'Customer Support', text: "We're Here to Help" },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wide">{title}</p>
                  <p className="text-[11px] text-ink/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-ink/10">
          <p className="pm-wrap py-5 text-center text-[11px] text-ink/70">© {new Date().getFullYear()} PlayMate Toy Store (sample). All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
