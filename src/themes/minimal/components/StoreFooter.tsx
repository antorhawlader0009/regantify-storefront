import Link from 'next/link';

interface StoreFooterProps {
  subdomain: string;
  storeName: string;
}

/**
 * Light, quiet footer — the opposite of Medium's solid dark block.
 * Understated rule lines instead of card borders, generous vertical
 * space, no bold uppercase section labels.
 */
export function StoreFooter({ subdomain, storeName }: StoreFooterProps) {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-display italic text-xl text-ink mb-3">{storeName}</p>
          <p className="text-[12.5px] text-muted leading-relaxed max-w-xs">
            Cash on delivery available nationwide. Considered, careful shipping on every order.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted mb-3.5 tracking-[0.08em] uppercase">Shop</p>
          <div className="flex flex-col gap-2.5 text-[13px] text-ink">
            <Link href={`/store/${subdomain}`} className="hover:text-accent transition-colors w-fit">
              All products
            </Link>
            <Link href={`/store/${subdomain}/cart`} className="hover:text-accent transition-colors w-fit">
              Your cart
            </Link>
            <Link href={`/store/${subdomain}/orders`} className="hover:text-accent transition-colors w-fit">
              Track an order
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted mb-3.5 tracking-[0.08em] uppercase">Delivery</p>
          <div className="flex flex-col gap-2.5 text-[13px] text-ink">
            <span>Inside Dhaka — ৳70</span>
            <span>Outside Dhaka — ৳130</span>
            <span>Cash on delivery</span>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 text-[11.5px] text-muted">
          © {new Date().getFullYear()} {storeName}
        </div>
      </div>
    </footer>
  );
}
