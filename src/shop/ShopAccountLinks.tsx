'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ClipboardList, Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useShopSession } from './shopClient';
import { useShopOverlay, type ShopPanel } from './overlay';

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
  const open = useShopOverlay((s) => s.open);
  const account = () => open(who ? 'orders' : 'login');
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <button type="button" onClick={account} className={`${iconBtn} hidden w-auto gap-2 px-3 text-sm font-semibold sm:flex`}>
        {who ? <ClipboardList size={18} aria-hidden /> : <User size={18} aria-hidden />}
        {who ? 'My orders' : 'Sign in'}
      </button>
      <button type="button" onClick={account} aria-label={who ? 'My orders' : 'Sign in'} className={`${iconBtn} sm:hidden`}>
        <User size={20} aria-hidden />
      </button>
      <button type="button" onClick={() => open('cart')} aria-label={`Cart${count ? `, ${count} items` : ''}`} className={iconBtn}>
        <ShoppingCart size={20} aria-hidden />
        <Badge count={count} />
      </button>
    </div>
  );
}

/** The phone bar's four tabs; the open one in the accent colour. */
export function ShopBottomNavLinks() {
  const path = usePathname() ?? '';
  const { who, count } = useSession();
  const p = path.replace(/^\/shop/, '') || '/';
  const { panel, open } = useShopOverlay();
  const tabs: Array<{ label: string; Icon: typeof Home; on: boolean; href?: string; panel?: ShopPanel; count?: number }> = [
    { href: '/shop', label: 'Home', Icon: Home, on: p === '/' && !panel },
    { href: '/shop#categories', label: 'Categories', Icon: LayoutGrid, on: p.startsWith('/c/') && !panel },
    { panel: 'cart', label: 'Cart', Icon: ShoppingCart, on: panel === 'cart' || panel === 'checkout', count },
    { panel: who ? 'orders' : 'login', label: who ? 'Orders' : 'Account', Icon: User, on: panel === 'orders' || panel === 'login' },
  ];
  const cls = (on: boolean) => `flex w-full flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${on ? 'text-[var(--shop-accent)]' : 'text-slate-400'}`;
  return (
    <ul className="grid grid-cols-4">
      {tabs.map(({ href, panel: target, label, Icon, on, count: n }) => {
        const inner = (
          <>
            <span className="relative">
              <Icon size={22} strokeWidth={on ? 2.4 : 1.8} aria-hidden />
              {n ? <Badge count={n} /> : null}
            </span>
            {label}
          </>
        );
        return (
          <li key={label}>
            {target ? (
              <button type="button" onClick={() => open(target)} className={cls(on)}>
                {inner}
              </button>
            ) : (
              <Link href={href!} className={cls(on)}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
