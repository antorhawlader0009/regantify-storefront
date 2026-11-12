'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { CoverFloating } from '@/lib/floatingCover';
import { MahabeshCardView } from '../MahabeshCard';
import { MhBrands, MhCategories, MhHero, MhProductGrid, MhPromoBanners, type MhHeroSlide } from '../MahabeshHome';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_HERO_SLIDES, DEMO_PRODUCTS, DEMO_PROMOS, type DemoProduct } from './demoData';

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function DemoCard({ p }: { p: DemoProduct }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <MahabeshCardView
      href="#"
      name={p.name}
      image={p.image}
      plainImage
      price={taka(p.price)}
      oldPrice={p.oldPrice ? taka(p.oldPrice) : null}
      badge={off > 0 ? { text: `−${off}%` } : null}
      wished={wished}
      onWish={() => setWished((v) => !v)}
      action={{
        label: 'Add to cart',
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

const Logo = () => <span className="text-[22px] font-extrabold tracking-[-0.04em] text-black sm:text-[24px]">Hearth &amp; Home</span>;

const STRIP = ['Shop all', 'Dining', 'Living', 'Decor', 'Lighting', 'Rugs', 'Storage'];

/**
 * The Mahabesh template's demo store (Store > Templates > View, for every plan): Mahabesh's own parts filled with sample home
 * and kitchen products and photos, so a seller sees the design before picking it. Nothing here reads or changes a store;
 * buttons only show what they do. Wrapped in data-theme / data-skin so Mahabesh's colours and fonts apply.
 */
export function MahabeshDemo() {
  const slides: MhHeroSlide[] = DEMO_HERO_SLIDES.map((s) => ({ key: s.key, image: s.image, title: s.title, href: '#featured' }));
  return (
    <div data-theme="storepal" data-skin="mahabesh" className="min-h-screen bg-white text-ink">
      {/* Keeps the store's own floating buttons and popups out of the preview. */}
      <CoverFloating />
      {/* What this page is, kept out of the design itself: a small label at the bottom of the screen. */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-center text-[12px] font-medium text-white shadow-lg">
        Template preview: <b>Mahabesh</b>. Sample products and pictures; your store shows your own.
      </div>

      <div className="overflow-hidden bg-black text-[13px] font-medium text-white">
        <div className="flex justify-center gap-16 px-8 py-[9px] whitespace-nowrap">
          <span className="mh-announce-item">Cash on delivery all over Bangladesh</span>
          <span className="mh-announce-item hidden sm:inline">Free delivery over ৳5,000</span>
        </div>
      </div>

      <header className="border-b border-[var(--mh-line)] bg-white">
        <div className="mh-wrap grid h-[60px] grid-cols-[auto_1fr_auto] items-center gap-2 lg:h-[72px] lg:gap-7">
          <span className="mh-icon-btn lg:hidden">
            <MenuIcon className="h-[19px] w-[19px]" />
          </span>
          <span className="justify-self-center lg:justify-self-start">
            <Logo />
          </span>
          <span className="hidden h-[46px] w-full max-w-[620px] items-center gap-2.5 justify-self-center rounded-full border-[1.5px] border-[var(--mh-line)] bg-[var(--mh-well)] pl-[18px] pr-1.5 lg:flex">
            <SearchIcon className="h-4 w-4 text-[#62646b]" />
            <span className="flex-1 text-[15px] text-[#9a9ca3]">Search products…</span>
            <span className="grid h-[34px] place-items-center rounded-full bg-black px-4 text-[13.5px] font-semibold text-white">Search</span>
          </span>
          <div className="col-start-3 flex items-center gap-1 justify-self-end lg:col-start-auto">
            <span className="hidden h-[42px] items-center gap-2 pl-1.5 pr-3 text-[14px] font-semibold lg:inline-flex">
              <span className="grid h-[30px] w-[30px] place-items-center">
                <UserIcon className="h-[18px] w-[18px]" />
              </span>
              Log in
            </span>
            <span className="mh-icon-btn hidden sm:grid">
              <HeartIcon className="h-[19px] w-[19px]" />
              <span className="absolute right-[1px] top-[3px] box-content flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 border-white bg-[var(--mh-brand)] px-[5px] text-[10.5px] font-bold leading-[18px] text-white">2</span>
            </span>
            <span className="mh-icon-btn">
              <BagIcon className="h-[19px] w-[19px]" />
              <span className="absolute right-[1px] top-[3px] box-content flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 border-white bg-[var(--mh-brand)] px-[5px] text-[10.5px] font-bold leading-[18px] text-white">3</span>
            </span>
          </div>
        </div>
        <nav className="hidden border-t border-[var(--mh-line)] lg:block" aria-label="Categories">
          <div className="mh-wrap flex h-[46px] items-center gap-0.5">
            {STRIP.map((label, i) => (
              <span key={label} className={`relative whitespace-nowrap rounded-full px-3.5 py-2 text-[14px] font-medium ${i === 0 ? 'mh-nav-active' : 'text-[#62646b]'}`}>
                {label}
              </span>
            ))}
          </div>
        </nav>
      </header>

      <MhHero slides={slides} shopLabel="Shop now" plainImage />
      <MhCategories exploreLabel="Shop now" plainImage title="Shop by category" viewAllLabel="Shop all" viewAllHref="#featured" items={DEMO_CATEGORIES.map((c) => ({ name: c.name, href: '#featured', image: c.image }))} />
      <MhProductGrid id="featured" title="On sale now" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(0, 5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </MhProductGrid>
      <MhPromoBanners plainImage banners={DEMO_PROMOS.map((b) => ({ ...b, href: '#featured' }))} />
      <MhProductGrid title="New arrivals" viewAllLabel="View all" viewAllHref="#featured">
        {DEMO_PRODUCTS.slice(5).map((p) => (
          <DemoCard key={p.id} p={p} />
        ))}
      </MhProductGrid>
      <MhBrands
        title="Brands"
        allLabel="View all"
        allHref="#featured"
        brands={DEMO_BRANDS.map((b) => ({ name: b.name, href: '#featured', count: b.count }))}
        stylesLabel={(n) => `${n} ${n === 1 ? 'product' : 'products'}`}
      />

      <footer className="mt-16 bg-[var(--mh-footer)] text-white lg:mt-[88px]">
        <div className="mh-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-[22px] font-extrabold tracking-[-0.04em]">Hearth &amp; Home</span>
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-[#c9cad0]">Everyday things for your home and kitchen. Cash on delivery everywhere in Bangladesh.</p>
          </div>
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold">Shop</h3>
            {['All products', 'Dining', 'Living', 'Decor'].map((l) => (
              <span key={l} className="block py-1 text-[14.5px] text-[#c9cad0]">
                {l}
              </span>
            ))}
          </div>
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold">Help</h3>
            {['Contact us', 'Track an order', 'Your cart'].map((l) => (
              <span key={l} className="block py-1 text-[14.5px] text-[#c9cad0]">
                {l}
              </span>
            ))}
          </div>
          <div>
            <h3 className="mb-3.5 text-[15px] font-bold">Get in touch</h3>
            <span className="flex items-center gap-2 py-1 text-[14.5px] text-[#c9cad0]">
              <Phone size={15} /> +880 1234 567890
            </span>
            <span className="flex items-center gap-2 py-1 text-[14.5px] text-[#c9cad0]">
              <Mail size={15} /> hello@example.com
            </span>
            <span className="flex items-center gap-2 py-1 text-[14.5px] text-[#c9cad0]">
              <MapPin size={15} /> Dhaka, Bangladesh
            </span>
          </div>
        </div>
        <div className="border-t border-[#2a2b30] py-5 pb-20 text-center text-[13px] text-[#8e9097] sm:pb-5">© {new Date().getFullYear()} Hearth &amp; Home (sample). Prices in Bangladeshi Taka.</div>
      </footer>
    </div>
  );
}
