'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { StorefrontPopupCampaign } from '@/lib/storefrontApi';
import { apiOrigin } from '@/lib/visitSession';
import { PopupCard, TOAST_WIDTH } from './PopupCard';

/**
 * Marketing > Campaigns > Popup, on StorePal stores only (mounted once in
 * store/[subdomain]/layout.tsx, like the GDPR Prompt). The server sends
 * every published popup that hasn't ended inside the cached store-info
 * answer; everything that depends on the shopper is decided here: has it
 * started, is this the right page, device, new or returning shopper, and
 * how often they have already seen it.
 *
 * Never shown on checkout, thank-you, payment, account, order-tracking or
 * landing pages, whatever "All pages" says: nothing may stand between a
 * shopper and paying. At most one dialog and one toast are open at a time.
 *
 * What it draws is PopupCard, the same markup as the builder's preview.
 */

const NEVER_ON = new Set(['checkout', 'thank-you', 'payment-callback', 'account', 'orders', 't', 'l']);

/** "/store/<subdomain>/product/x" or "/product/x" -> "/product/x" ("/" for the home page). */
function storePath(pathname: string, subdomain: string): string {
  const prefix = `/store/${subdomain}`;
  let p = pathname === prefix || pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
  if (!p.startsWith('/')) p = `/${p}`;
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

function pageAllowed(popup: StorefrontPopupCampaign, path: string): boolean {
  if (NEVER_ON.has(path.split('/')[1] ?? '')) return false;
  switch (popup.pageScope) {
    case 'ALL':
      return true;
    case 'HOME':
      return path === '/';
    case 'PRODUCT':
      return path.startsWith('/product/');
    case 'CART':
      return path === '/cart';
    case 'SPECIFIC':
      return popup.pagePaths.some((raw) => {
        const pattern = raw.trim();
        if (pattern.endsWith('*')) return path.startsWith(pattern.slice(0, -1));
        return (pattern.length > 1 ? pattern.replace(/\/+$/, '') : pattern) === path;
      });
  }
}

// ---- what this browser has already seen (all optional: storage can be blocked)

const seenKey = (subdomain: string) => `storepal:popup-seen:${subdomain}`;
const sessionKey = (subdomain: string) => `storepal:popup-session:${subdomain}`;

function readJson(storage: Storage | undefined, key: string): Record<string, number> {
  try {
    return JSON.parse(storage?.getItem(key) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function writeJson(storage: Storage | undefined, key: string, value: Record<string, number>) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked: it just won't be remembered.
  }
}

/** True for the whole first visit (this tab's session), false once they come back. */
function isNewVisitor(subdomain: string): boolean {
  const flag = `storepal:new-visitor:${subdomain}`;
  const first = `storepal:first-visit:${subdomain}`;
  try {
    const known = sessionStorage.getItem(flag);
    if (known !== null) return known === '1';
    const returning = localStorage.getItem(first) !== null;
    sessionStorage.setItem(flag, returning ? '0' : '1');
    if (!returning) localStorage.setItem(first, String(Date.now()));
    return !returning;
  } catch {
    return true;
  }
}

const DAY = 24 * 60 * 60 * 1000;

function frequencyAllows(popup: StorefrontPopupCampaign, subdomain: string): boolean {
  if (popup.frequency === 'EVERY_PAGE') return true;
  if (popup.frequency === 'ONCE_PER_SESSION') return !readJson(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, sessionKey(subdomain))[popup.id];
  const last = readJson(typeof localStorage === 'undefined' ? undefined : localStorage, seenKey(subdomain))[popup.id];
  if (!last) return true;
  if (popup.frequency === 'ONCE_EVER') return false;
  return Date.now() - last >= (popup.frequency === 'ONCE_PER_DAY' ? DAY : 7 * DAY);
}

function markSeen(popup: StorefrontPopupCampaign, subdomain: string) {
  const now = Date.now();
  const local = readJson(localStorage, seenKey(subdomain));
  writeJson(localStorage, seenKey(subdomain), { ...local, [popup.id]: now });
  const session = readJson(sessionStorage, sessionKey(subdomain));
  writeJson(sessionStorage, sessionKey(subdomain), { ...session, [popup.id]: now });
}

function beacon(subdomain: string, popupId: string, type: 'VIEW' | 'CLICK') {
  try {
    void fetch(`${apiOrigin()}/v1/store/${subdomain}/popups/${popupId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // A dropped count is never worth a broken page.
  }
}

export function PopupCampaigns({
  subdomain,
  popups,
  accentColor,
}: {
  subdomain: string;
  popups: StorefrontPopupCampaign[];
  /** Store > Branding accent; null follows the theme's own accent. */
  accentColor: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dialog, setDialog] = useState<StorefrontPopupCampaign | null>(null);
  const [toast, setToast] = useState<StorefrontPopupCampaign | null>(null);

  const close = useCallback((popup: StorefrontPopupCampaign) => {
    if (popup.format === 'DIALOG') setDialog((cur) => (cur?.id === popup.id ? null : cur));
    else setToast((cur) => (cur?.id === popup.id ? null : cur));
  }, []);

  useEffect(() => {
    if (popups.length === 0) return;
    const path = storePath(pathname ?? '/', subdomain);
    const cleanups: (() => void)[] = [];
    setDialog(null);
    setToast(null);

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const newVisitor = isNewVisitor(subdomain);
    const now = Date.now();
    let dialogTaken = false;
    let toastTaken = false;

    const show = (popup: StorefrontPopupCampaign) => {
      // One dialog and one toast per page view.
      if (popup.format === 'DIALOG' ? dialogTaken : toastTaken) return;
      if (popup.format === 'DIALOG') dialogTaken = true;
      else toastTaken = true;
      markSeen(popup, subdomain);
      beacon(subdomain, popup.id, 'VIEW');
      if (popup.format === 'DIALOG') setDialog(popup);
      else setToast(popup);
      if (popup.autoCloseSeconds) {
        const t = setTimeout(() => close(popup), popup.autoCloseSeconds * 1000);
        cleanups.push(() => clearTimeout(t));
      }
    };

    for (const popup of popups) {
      if (popup.startsAt && new Date(popup.startsAt).getTime() > now) continue;
      if (popup.endsAt && new Date(popup.endsAt).getTime() <= now) continue;
      if (popup.devices === 'DESKTOP' && isMobile) continue;
      if (popup.devices === 'MOBILE' && !isMobile) continue;
      if (popup.audience === 'NEW' && !newVisitor) continue;
      if (popup.audience === 'RETURNING' && newVisitor) continue;
      if (!pageAllowed(popup, path)) continue;
      if (!frequencyAllows(popup, subdomain)) continue;

      if (popup.trigger === 'IMMEDIATE' || popup.trigger === 'DELAY') {
        const wait = popup.trigger === 'IMMEDIATE' ? 400 : Math.max(0, popup.triggerSeconds) * 1000;
        const t = setTimeout(() => show(popup), wait);
        cleanups.push(() => clearTimeout(t));
      } else if (popup.trigger === 'SCROLL') {
        const check = () => {
          const room = document.documentElement.scrollHeight - window.innerHeight;
          // A page too short to scroll counts as read after a few seconds.
          if (room <= 0) return;
          if ((window.scrollY / room) * 100 >= popup.triggerScrollPercent) {
            window.removeEventListener('scroll', check);
            show(popup);
          }
        };
        window.addEventListener('scroll', check, { passive: true });
        const short = document.documentElement.scrollHeight - window.innerHeight <= 0;
        const t = short ? setTimeout(() => show(popup), 3000) : null;
        cleanups.push(() => {
          window.removeEventListener('scroll', check);
          if (t) clearTimeout(t);
        });
      } else if (popup.trigger === 'EXIT_INTENT') {
        // The pointer leaving through the top of the window; touch screens have no such thing.
        if (!window.matchMedia('(hover: hover)').matches) continue;
        const leave = (e: MouseEvent) => {
          if (e.relatedTarget === null && e.clientY <= 0) {
            document.removeEventListener('mouseout', leave);
            show(popup);
          }
        };
        document.addEventListener('mouseout', leave);
        cleanups.push(() => document.removeEventListener('mouseout', leave));
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname, popups, subdomain, close]);

  // Escape closes the dialog.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog]);

  const clickButton = (popup: StorefrontPopupCampaign) => {
    beacon(subdomain, popup.id, 'CLICK');
    close(popup);
    const link = popup.buttonLink;
    if (!link) return;
    if (link.startsWith('/')) router.push(`/store/${subdomain}${link === '/' ? '' : link}`);
    else window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (!dialog && !toast) return null;
  const accent = accentColor ?? 'var(--color-accent)';

  return (
    <>
      <style>{`@keyframes spPopIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dialog.headline || 'Message from the store'}
          onClick={() => setDialog(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: `rgba(0,0,0,${dialog.overlayOpacity / 100})`,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: dialog.width, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', borderRadius: dialog.cornerRadius, animation: 'spPopIn .25s ease-out' }}
          >
            <PopupCard popup={dialog} accent={accent} onClose={() => setDialog(null)} onButton={() => clickButton(dialog)} />
          </div>
        </div>
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 16,
            ...(toast.toastCorner === 'BOTTOM_LEFT' ? { left: 16 } : { right: 16 }),
            zIndex: 70,
            width: `min(${TOAST_WIDTH}px, calc(100vw - 32px))`,
            animation: 'spPopIn .25s ease-out',
          }}
        >
          <PopupCard popup={toast} accent={accent} onClose={() => setToast(null)} onButton={() => clickButton(toast)} />
        </div>
      )}
    </>
  );
}
