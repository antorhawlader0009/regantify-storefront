'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * "Install as app" for every template (each draws its own banner). Decides in the browser whether to offer it:
 *  - only to a returning shopper: seen on 2 different days, or has placed an order here (the thank-you page marks it);
 *  - only on a phone or tablet, never when already opened as the app, never on checkout and payment pages;
 *  - "Not now" hides it for 30 days; once installed it never shows again.
 * Android (Chrome, Edge, Samsung Internet) gives the page a `beforeinstallprompt` event, kept here so the banner's button opens the
 * real install dialog. iPhones and iPads have no such event: the banner shows the steps instead (Share, then Add to Home Screen).
 * Everything is kept per store in this browser's localStorage; nothing goes to a server.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  // Registered as soon as this file loads, because the browser fires the event once, early.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const DAY_MS = 86_400_000;
const SNOOZE_MS = 30 * DAY_MS;
const SKIP_PAGES = /\/(checkout|payment-callback|pay|cart|i|r|t)(\/|$)/;

const key = (subdomain: string) => `regantify-app:${subdomain}`;
interface Saved {
  days: string[];
  ordered?: boolean;
  snoozedUntil?: number;
  installed?: boolean;
}
function read(subdomain: string): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(key(subdomain)) ?? '{}') as Partial<Saved>;
    return { days: Array.isArray(v.days) ? v.days.slice(-10) : [], ordered: !!v.ordered, snoozedUntil: Number(v.snoozedUntil) || 0, installed: !!v.installed };
  } catch {
    return { days: [] };
  }
}
function write(subdomain: string, s: Saved) {
  try {
    localStorage.setItem(key(subdomain), JSON.stringify(s));
  } catch {
    /* private mode: nothing is remembered */
  }
}

export type InstallMode = 'PROMPT' | 'IOS_STEPS';

export function useInstallApp(subdomain: string, enabled: boolean, pathname: string) {
  const [mode, setMode] = useState<InstallMode | null>(null);

  const decide = useCallback(() => {
    if (!enabled) return setMode(null);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    const phone = window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 1024;
    const s = read(subdomain);
    const regular = s.days.length >= 2 || !!s.ordered;
    if (standalone || !phone || s.installed || (s.snoozedUntil ?? 0) > Date.now() || !regular || SKIP_PAGES.test(pathname)) return setMode(null);
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setMode(deferred ? 'PROMPT' : ios ? 'IOS_STEPS' : null);
  }, [enabled, subdomain, pathname]);

  // Count today's visit (and an order, on the thank-you page) once per page.
  useEffect(() => {
    const s = read(subdomain);
    const today = new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
    if (!s.days.includes(today)) s.days = [...s.days, today].slice(-10);
    if (/\/thank-you(\/|$)/.test(pathname)) s.ordered = true;
    write(subdomain, s);
  }, [subdomain, pathname]);

  useEffect(() => {
    const t = setTimeout(decide, 4000);
    listeners.add(decide);
    return () => {
      clearTimeout(t);
      listeners.delete(decide);
    };
  }, [decide]);

  const install = useCallback(async () => {
    if (!deferred) return;
    const e = deferred;
    deferred = null;
    await e.prompt();
    const choice = await e.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
    const s = read(subdomain);
    if (choice.outcome === 'accepted') s.installed = true;
    else s.snoozedUntil = Date.now() + SNOOZE_MS;
    write(subdomain, s);
    setMode(null);
  }, [subdomain]);

  const dismiss = useCallback(() => {
    write(subdomain, { ...read(subdomain), snoozedUntil: Date.now() + SNOOZE_MS });
    setMode(null);
  }, [subdomain]);

  return { mode, install, dismiss };
}
