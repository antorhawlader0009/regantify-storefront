import Link from 'next/link';

interface StoreFooterProps {
  subdomain: string;
  storeName: string;
}

export function StoreFooter({ subdomain, storeName }: StoreFooterProps) {
  return (
    <footer className="bg-ink text-white mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-white mb-2">{storeName}</p>
          <p className="text-[12.5px] text-white/55 leading-relaxed max-w-xs">
            Cash on delivery available nationwide. Fast, reliable shipping on every order.
          </p>
        </div>

        <div>
          <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">Shop</p>
          <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
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
          <p className="text-[11.5px] font-bold text-white mb-3 uppercase tracking-wider">Delivery</p>
          <div className="flex flex-col gap-2.5 text-[12.5px] text-white/60">
            <span>Inside Dhaka — ৳70</span>
            <span>Outside Dhaka — ৳130</span>
            <span>Cash on delivery</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11.5px] text-white/35">
          © {new Date().getFullYear()} {storeName}
        </div>
      </div>
    </footer>
  );
}
