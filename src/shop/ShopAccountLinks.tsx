'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useShopSession } from './shopClient';

/** The header's right side (2026-11-03): sign in / my orders, and the one cart for every shop. Loads the session once per page. */
export function ShopAccountLinks() {
  const { ready, who, lines, load } = useShopSession();
  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <div className="flex shrink-0 items-center gap-4 text-sm font-medium text-slate-700">
      {who ? (
        <Link href="/shop/orders" className="hover:text-emerald-700">
          My orders
        </Link>
      ) : (
        <Link href="/shop/login" className="hover:text-emerald-700">
          Sign in
        </Link>
      )}
      <Link href="/shop/cart" className="relative rounded-lg border border-slate-200 px-3 py-1.5 hover:border-emerald-600 hover:text-emerald-700">
        Cart
        {count > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-emerald-600 px-1.5 text-center text-xs font-semibold leading-5 text-white">{count}</span>
        ) : null}
      </Link>
    </div>
  );
}
