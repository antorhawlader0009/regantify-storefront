'use client';

import { useEffect, useState } from 'react';

import { Smartphone } from 'lucide-react';
import { useAppAvailable } from '@/lib/appAvailable';

/**
 * "Get the Regantify app" in a store's footer, for every template. Links to the store's own /app page (Play button with this store in the
 * referrer, the APK, a QR code). Shown only while the app can be downloaded, and hidden inside the app itself (the `rg-hide-in-app` rule in
 * globals.css, set before the page runs, so there is no flash).
 */
export function GetAppLink({ subdomain, label = 'Get the Regantify app', className = '' }: { subdomain: string; label?: string; className?: string }) {
  const available = useAppAvailable();
  if (!available) return null;
  return (
    <a href={`/store/${subdomain}/app`} data-rg="get-app" className={`rg-hide-in-app inline-flex items-center gap-1.5 ${className}`}>
      <Smartphone size={14} aria-hidden /> {label}
    </a>
  );
}

/**
 * "About this app" in a store's own app (STORE-APP-plan.md Step 11): that app has no home screen, so the footer is where the shopper reaches its
 * About and Licences screen (the Bangla voice credit is a licence duty). Shown only inside a store's own app (RegantifyApp.flavor is "store").
 */
export function AboutAppLink({ label = 'About this app', className = '' }: { label?: string; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const app = (window as unknown as { RegantifyApp?: { flavor?: string; about?: () => void } }).RegantifyApp;
    setShow(app?.flavor === 'store' && typeof app.about === 'function');
  }, []);
  if (!show) return null;
  return (
    <button type="button" data-rg="about-app" onClick={() => (window as unknown as { RegantifyApp?: { about?: () => void } }).RegantifyApp?.about?.()} className={`ml-4 ${className}`}>
      {label}
    </button>
  );
}
