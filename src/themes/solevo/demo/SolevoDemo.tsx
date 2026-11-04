'use client';

import { useEffect, useState } from 'react';
import { Headset, Medal, ShieldCheck, Tag, Footprints } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { SolevoCardView } from '../SolevoCard';
import { SvBrands, SvCategories, SvFeatures, SvHero, SvProductGrid, SvPromoBanners, type SvHeroSlide } from '../SolevoHome';
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, TruckIcon, UserIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

/** Sample prices in taka (the demo's dollars x 120, to the nearest 10). */
const taka = (usd: number) => `৳${(Math.round((usd * 120) / 10) * 10).toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <SolevoCardView
      href="#"
      name={p.name}
      subtitle={p.category}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `-${off}%`, tone: 'sale' } : p.isNew ? { text: 'NEW' } : null}
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

/** The template's dark announcement bar with sample words, folding away with its close button. */
function DemoTopBar() {
  const [i, setI] = useState(0);
  const [gone, setGone] = useState(false);
  const messages = ['Free delivery on orders over ৳9,000', '30-day easy returns', 'Sale up to 29% off'];
  useEffect(() => {
    const timer = setInterval(() => setI((v) => (v + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);
  if (gone) return null;
  return (
    <div className="relative bg-[#111111] text-[10px] font-medium uppercase tracking-wider text-white sm:text-[11px]">
      <div className="sv-wrap relative flex min-h-9 items-center justify-center gap-4 px-10 py-2 text-center">
        <span className="hidden items-center gap-3 lg:flex">
          {messages.map((m, idx) => (
            <span key={m} className="inline-flex items-center gap-3">
              {idx > 0 && <span className="text-[var(--sv-gold)]">✦</span>}
              {m}
            </span>
          ))}
        </span>
        <span className="inline-flex items-center gap-2 lg:hidden">
          <span className="text-[var(--sv-gold)]">✦</span>
          <span key={i} className="sv-fade-in">
            {messages[i]}
          </span>
          <span className="text-[var(--sv-gold)]">✦</span>
        </span>
        <button type="button" onClick={() => setGone(true)} aria-label="Close announcement bar" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-white/80 hover:text-white sm:right-4">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const Wordmark = ({ light = false }: { light?: boolean }) => (
  <span className="inline-flex flex-col leading-none">
    <span className={`font-display text-[28px] font-semibold tracking-wide sm:text-[32px] ${light ? 'text-white' : 'text-ink'}`}>
      SOLE<span className="text-[var(--sv-gold)]">VO</span>
    </span>
    <span className={`mt-1 text-[7px] font-medium uppercase tracking-[0.32em] ${light ? 'text-white/70' : 'text-ink/70'}`}>Step up your style</span>
  </span>
);

/**
 * The Solevo template's demo store (Store > Templates > View, for every plan): Solevo's own parts filled with the template's
 * sample shoes and photos, so a seller sees the design before picking it. Nothing here reads or changes a store; buttons
 * only show what they do. Wrapped in data-theme / data-skin so Solevo's colours and fonts apply.
 */
export function SolevoDemo() {
  const slides: SvHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, eyebrow: s.eyebrow, title: s.title, accent: s.accent, text: s.text, href: '#featured' }));
  const iconCls = 'h-8 w-8';
  return (
    <div data-theme="storepal" data-skin="solevo" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Solevo</b>. Sample products and pictures; your store shows your own.
      </div>

      <DemoTopBar />

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="sv-wrap flex h-[64px] items-center justify-between gap-3 sm:h-[68px] lg:h-[76px]">
          <MenuIcon className="h-6 w-6 lg:hidden" />
          <Wordmark />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Main">
            {['Home', 'Men', 'Women', 'Kids', 'New Arrivals', 'Best Sellers', 'Brands', 'Sale'].map((label, i) => (
              <span key={label} className="relative py-1 text-[11px] font-medium uppercase tracking-wider text-ink/80">
                {label}
                {i === 0 && <span className="absolute -bottom-1 left-0 h-[1.5px] w-full bg-ink" />}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3.5 sm:gap-5">
            <SearchIcon className="h-[22px] w-[22px]" />
            <UserIcon className="h-[22px] w-[22px]" />
            <span className="relative">
              <HeartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sv-gold)] px-1 text-[9px] font-semibold text-white">2</span>
            </span>
            <span className="relative">
              <BagIcon className="h-[22px] w-[22px]" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sv-gold)] px-1 text-[9px] font-semibold text-white">3</span>
            </span>
          </div>
        </div>
      </header>

      <SvHero
        slides={slides}
        shopLabel="Shop Now"
        exploreLabel="Explore Collection"
        exploreHref="#categories"
        plainImage
        badge={{ top: 'Up to', big: '29%', bottom: 'OFF', cta: 'Shop Now', href: '#featured' }}
      />
      <SvCategories exploreLabel="Explore Now" plainImage items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <SvProductGrid id="featured" title="Featured Products" sub="Our most loved pairs, picked for you" viewAllLabel="View All Products" viewAllHref="#featured">
        {DEMO_PRODUCTS.map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </SvProductGrid>
      <SvPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <SvBrands
        title="Trending Brands"
        allLabel="Shop All Brands"
        allHref="#featured"
        brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))}
        stylesLabel={(n) => `${n} ${n === 1 ? 'style' : 'styles'}`}
      />
      <SvFeatures
        title="Why Shop With Us?"
        items={[
          { key: '1', icon: <Footprints className={iconCls} strokeWidth={1.5} />, title: 'Exclusive Styles', text: "Unique designs you won't find anywhere else." },
          { key: '2', icon: <ShieldCheck className={iconCls} strokeWidth={1.5} />, title: 'Top Quality', text: 'Premium materials for long-lasting comfort.' },
          { key: '3', icon: <Tag className={iconCls} strokeWidth={1.5} />, title: 'Affordable Prices', text: 'Best styles at prices that make sense.' },
          { key: '4', icon: <Medal className={iconCls} strokeWidth={1.5} />, title: 'Happy Customers', text: 'Join thousands of satisfied shoe lovers worldwide.' },
        ]}
      />

      <footer className="mt-10 bg-[var(--sv-footer)] text-white">
        <div className="sv-wrap grid grid-cols-2 gap-x-6 gap-y-9 py-10 sm:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1.3fr_1fr_1.2fr] lg:gap-x-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Wordmark light />
            <p className="mt-4 max-w-[260px] text-xs leading-relaxed text-white/70">Premium shoes for every step you take. Style, comfort &amp; quality, all in one place.</p>
            <div className="mt-5 flex gap-5 text-white/80">
              <FacebookIcon className="h-[18px] w-[18px]" />
              <InstagramIcon className="h-[18px] w-[18px]" />
              <YoutubeIcon className="h-[18px] w-[18px]" />
            </div>
          </div>
          {[
            { title: 'Shop', links: ['Men', 'Women', 'Kids', 'Sports', 'Boots', 'Accessories', 'Sale'] },
            { title: 'Customer Service', links: ['Contact Us', 'FAQ', 'Shipping & Delivery', 'Returns & Exchanges', 'Size Guide', 'Track Order'] },
            { title: 'Company', links: ['About Us', 'Our Stores', 'Privacy Policy', 'Terms & Conditions'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l} className="text-xs text-white/70">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1">
            {[
              { Icon: TruckIcon, title: 'Fast Delivery', text: 'All over Bangladesh' },
              { Icon: ShieldCheck, title: 'Secure Payment', text: '100% Safe & Secure' },
              { Icon: Headset, title: 'Customer Support', text: "We're Here to Help" },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <Icon className="h-8 w-8 shrink-0 text-white/80" strokeWidth={1.5} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider">{title}</p>
                  <p className="text-[11px] text-white/60">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-white/10 px-4 py-4 pb-20 text-center text-[11px] text-white/60 sm:pb-4">© {new Date().getFullYear()} Solevo Shoe Store (sample). All Rights Reserved.</div>
      </footer>
    </div>
  );
}
