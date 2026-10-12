import type { ReactNode } from 'react';
import type { StorefrontSetupGuide } from '@/lib/storefrontApi';

/**
 * What a brand-new StorePal store shows while it has no public product:
 * a short "get your store ready" board instead of an empty shop. Every card
 * opens the matching page of the vendor's dashboard (`setup.dashboardUrl`);
 * a card whose job is already done (`setup.done`) is left out, and the whole
 * board disappears the moment the first product is public (HomeView only
 * renders it while `products` is empty, and the server sends `setup: null`
 * once one exists), so the shop then shows as usual.
 * The pictures are drawn here as small SVGs, so there is nothing to load.
 */

interface CardProps {
  title: string;
  text: string;
  button: string;
  href: string | null;
  art: ReactNode;
  tall?: boolean;
}

function SetupCard({ title, text, button, href, art, tall }: CardProps) {
  const buttonClass =
    'inline-flex items-center rounded-lg border border-line-strong bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink shadow-sm transition hover:bg-canvas';
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h3 className="m-0 text-[15px] font-bold text-ink">{title}</h3>
      <p className="mt-1 mb-3 max-w-[34ch] text-[13px] leading-relaxed text-muted">{text}</p>
      <div className={`flex items-center justify-center ${tall ? 'h-44' : 'h-32'}`} aria-hidden>
        {art}
      </div>
      <div className="mt-3">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass}>
            {button}
          </a>
        ) : (
          <span className={`${buttonClass} cursor-default opacity-70`}>{button}</span>
        )}
      </div>
    </div>
  );
}

const SVG_PROPS = { viewBox: '0 0 240 130', className: 'h-full w-auto', role: 'img', 'aria-hidden': true } as const;

function ProductArt() {
  return (
    <svg {...SVG_PROPS}>
      <rect x="18" y="26" width="64" height="78" rx="10" fill="#EEF2FF" />
      <path d="M32 92 L50 56 L68 92 Z" fill="#C7D2FE" />
      <circle cx="62" cy="44" r="7" fill="#A5B4FC" />
      <rect x="92" y="14" width="64" height="94" rx="12" fill="#fff" stroke="#CBD5E1" strokeDasharray="5 4" strokeWidth="1.6" />
      <path d="M124 52 v22 M113 63 h22" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
      <rect x="166" y="30" width="56" height="74" rx="10" fill="#DCFCE7" />
      <path d="M180 94 V62 q0 -14 14 -14 q14 0 14 14 V94" fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
      <rect x="176" y="78" width="36" height="9" rx="4" fill="#86EFAC" />
    </svg>
  );
}

function DesignArt() {
  return (
    <svg {...SVG_PROPS}>
      <rect x="14" y="26" width="62" height="82" rx="10" fill="#FDE68A" transform="rotate(-6 45 67)" />
      <circle cx="44" cy="58" r="10" fill="#FBBF24" transform="rotate(-6 45 67)" />
      <rect x="86" y="14" width="76" height="102" rx="12" fill="#fff" stroke="#E2E8F0" strokeWidth="1.6" />
      <rect x="112" y="42" width="40" height="40" rx="9" fill="#334155" />
      <text x="132" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">Aa</text>
      <rect x="95" y="42" width="9" height="9" rx="2" fill="#CBD5E1" />
      <rect x="95" y="56" width="9" height="9" rx="2" fill="#CBD5E1" />
      <rect x="95" y="70" width="9" height="9" rx="2" fill="#CBD5E1" />
      <rect x="170" y="22" width="58" height="86" rx="10" fill="#FECACA" transform="rotate(5 199 65)" />
      <path d="M180 78 q14 -26 30 0" fill="none" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" transform="rotate(5 199 65)" />
    </svg>
  );
}

function PaymentArt() {
  return (
    <svg {...SVG_PROPS}>
      <rect x="34" y="30" width="108" height="66" rx="10" fill="#1E293B" transform="rotate(-8 88 63)" />
      <rect x="46" y="46" width="22" height="16" rx="3" fill="#FBBF24" transform="rotate(-8 88 63)" />
      <rect x="46" y="74" width="60" height="6" rx="3" fill="#475569" transform="rotate(-8 88 63)" />
      <rect x="108" y="42" width="108" height="66" rx="10" fill="#2563EB" transform="rotate(5 162 75)" />
      <circle cx="176" cy="76" r="16" fill="#F97316" fillOpacity=".9" transform="rotate(5 162 75)" />
      <circle cx="194" cy="76" r="16" fill="#EF4444" fillOpacity=".75" transform="rotate(5 162 75)" />
      <rect x="120" y="58" width="46" height="6" rx="3" fill="#93C5FD" transform="rotate(5 162 75)" />
    </svg>
  );
}

function DomainArt() {
  return (
    <svg {...SVG_PROPS}>
      <rect x="26" y="20" width="188" height="96" rx="12" fill="#F1F5F9" />
      <rect x="44" y="36" width="152" height="26" rx="13" fill="#fff" stroke="#CBD5E1" strokeWidth="1.4" />
      <rect x="58" y="47" width="62" height="4" rx="2" fill="#CBD5E1" />
      <text x="168" y="54" textAnchor="middle" fontSize="12" fontWeight="600" fill="#475569" fontFamily="system-ui, sans-serif">.com</text>
      <path d="M150 74 L150 108 L158 100 L165 114 L171 111 L164 98 L175 97 Z" fill="#1E293B" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ShippingArt() {
  return (
    <svg {...SVG_PROPS}>
      <path d="M70 52 L120 30 L172 52 L172 100 L120 118 L70 100 Z" fill="#E2E8F0" />
      <path d="M70 52 L120 72 L172 52" fill="none" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M120 72 V118" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M95 41 L146 62 L146 74 L95 53 Z" fill="#FBBF24" />
      <rect x="132" y="88" width="30" height="16" rx="3" fill="#fff" stroke="#94A3B8" strokeWidth="1.2" transform="rotate(-8 147 96)" />
      <path d="M137 94 h20 M137 99 h12" stroke="#94A3B8" strokeWidth="1.4" transform="rotate(-8 147 96)" />
    </svg>
  );
}

export function StoreSetupGuide({ storeName, setup }: { storeName: string; setup: StorefrontSetupGuide | null | undefined }) {
  const base = setup?.dashboardUrl ?? null;
  const link = (path: string) => (base ? `${base}${path}` : null);
  const done = setup?.done;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 text-center">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-wider text-muted">Opening soon</p>
        <h1 className="mt-1 mb-2 text-[24px] font-bold text-ink sm:text-[28px]">{storeName} is almost ready</h1>
        <p className="m-0 text-[14px] text-muted">
          The store opens as soon as the first product is added. These steps are for the store owner.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SetupCard
          tall
          title="Add your first product"
          text="Start with a title, price and a photo. You can always add more detail later."
          button="Add product"
          href={link('/vendor/product/add')}
          art={<ProductArt />}
        />
        {!done?.design && (
          <SetupCard
            tall
            title="Choose your store design"
            text="Pick a look that fits your brand, then customize it from there."
            button="Choose theme"
            href={link('/vendor/store/design')}
            art={<DesignArt />}
          />
        )}
      </div>

      {(!done?.payments || !done?.domain || !done?.shipping) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!done?.payments && (
            <SetupCard
              title="Set up payments"
              text="Choose a payment provider so customers can pay by card or mobile wallet."
              button="Activate payments"
              href={link('/vendor/store/payment-gateway')}
              art={<PaymentArt />}
            />
          )}
          {!done?.domain && (
            <SetupCard
              title="Get a custom domain"
              text="Give your store a branded address that is easy to find, trust and remember."
              button="Set up domain"
              href={link('/vendor/store/domain')}
              art={<DomainArt />}
            />
          )}
          {!done?.shipping && (
            <SetupCard
              title="Review shipping rates"
              text="Check the delivery charges set for Dhaka and the rest of the country."
              button="Review rates"
              href={link('/vendor/store/delivery-charge')}
              art={<ShippingArt />}
            />
          )}
        </div>
      )}
    </main>
  );
}
