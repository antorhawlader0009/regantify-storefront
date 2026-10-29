'use client';

import { useStoreLanguageSwitch } from '../lib/designSettings';

/**
 * The shopper's Bangla / English switch in StorePal's header. The store's own language is the default; a shopper's
 * pick is kept in this browser for this store (lib/shopperLanguage.ts), so they switch once, not on every visit.
 */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center rounded-full border border-line p-0.5 text-[11.5px] font-semibold ${className}`}>
      {(['bn', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          aria-pressed={language === l}
          lang={l}
          className={`rounded-full px-2 py-0.5 transition-colors ${language === l ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
        >
          {l === 'bn' ? 'বাং' : 'EN'}
        </button>
      ))}
    </div>
  );
}
