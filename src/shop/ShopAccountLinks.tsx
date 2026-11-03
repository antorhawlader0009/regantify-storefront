'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ClipboardList, Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useShopSession } from './shopClient';

function useSession() {
  const s = useShopSession();
  useEffect(() => {
    if (!s.ready) void s.load();
  }, [s]);
  return { who: s.who, count: s.lines.reduce((n, l) => n + l.quantity, 0) };
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-slate-900 px-1.5 text-center text-[11px] font-bold leading-5 text-white ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

const iconBtn = 'relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/20 text-white transition hover:bg-white/30';

/** The header's right side (2026-11-03 redesign): account (sign in, or my orders) and the one cart for every shop, as white-on-accent squares. */
export function ShopAccountLinks() {
  const { who, count } = useSession();
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Link href={who ? '/shop/orders' : '/shop/login'} className={`${iconBtn} hidden w-auto gap-2 px-3 text-sm font-semibold sm:flex`}>
        {who ? <ClipboardList size={18} aria-hidden /> : <User size={18} aria-hidden />}
        {who ? 'My orders' : 'Sign in'}
      </Link>
      <Link href={who ? '/shop/orders' : '/shop/login'} aria-label={who ? 'My orders' : 'Sign in'} className={`${iconBtn} sm:hidden`}>
        <User size={20} aria-hidden />
      </Link>
      <Link href="/shop/cart" aria-label={`Cart${count ? `, ${count} items` : ''}`} className={iconBtn}>
        <ShoppingCart size={20} aria-hidden />
        <Badge count={count} />
      </Link>
    </div>
  );
}

/** The phone bar's four tabs; the open one in the accent colour. */
export function ShopBottomNavLinks() {
  const path = usePathname() ?? '';
  const { who, count } = useSession();
  const p = path.replace(/^\/shop/, '') || '/';
  const tabs = [
    { href: '/shop', label: 'Home', Icon: Home, on: p === '/' },
    { href: '/shop#categories', label: 'Categories', Icon: LayoutGrid, on: p.startsWith('/c/') },
    { href: '/shop/cart', label: 'Cart', Icon: ShoppingCart, on: p.startsWith('/cart') || p.startsWith('/checkout'), count },
    { href: who ? '/shop/orders' : '/shop/login', label: who ? 'Orders' : 'Account', Icon: User, on: p.startsWith('/orders') || p.startsWith('/login') },
  ];
  return (
    <ul className="grid grid-cols-4">
      {tabs.map(({ href, label, Icon, on, count: n }) => (
        <li key={label}>
          <Link href={href} className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${on ? 'text-[var(--shop-accent)]' : 'text-slate-400'}`}>
            <span className="relative">
              <Icon size={22} strokeWidth={on ? 2.4 : 1.8} aria-hidden />
              {n ? <Badge count={n} /> : null}
            </span>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
