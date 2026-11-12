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

/** Mahabesh's switch: two small pills like its category links, the chosen language filled black. */
export function MahabeshLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center gap-0.5 text-[12.5px] font-semibold ${className}`}>
      {(['bn', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          aria-pressed={language === l}
          lang={l}
          className={`rounded-full px-2.5 py-1 transition-colors ${language === l ? 'bg-black text-white' : 'text-[#62646b] hover:bg-[var(--mh-well)] hover:text-black'}`}
        >
          {l === 'bn' ? 'বাং' : 'EN'}
        </button>
      ))}
    </div>
  );
}

/** Chronics's switch, in its header's style: small text like its menu links, the chosen language in coral. */
export function ChronicsLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center gap-1.5 text-xs font-medium ${className}`}>
      {(['bn', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30" aria-hidden>/</span>}
          <button
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={language === l}
            lang={l}
            className={`transition-colors ${language === l ? 'text-[var(--cr-brand)]' : 'text-ink/80 hover:text-[var(--cr-brand)]'}`}
          >
            {l === 'bn' ? 'বাং' : 'EN'}
          </button>
        </span>
      ))}
    </div>
  );
}

/** Chicwove's switch, in its header's style: small text like its menu links, the chosen language in coral. */
export function ChicwoveLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center gap-1.5 text-xs font-medium ${className}`}>
      {(['bn', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30" aria-hidden>/</span>}
          <button
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={language === l}
            lang={l}
            className={`transition-colors ${language === l ? 'text-[var(--cw-brand)]' : 'text-ink/80 hover:text-[var(--cw-brand)]'}`}
          >
            {l === 'bn' ? 'বাং' : 'EN'}
          </button>
        </span>
      ))}
    </div>
  );
}

/** Solevo's switch, in its header's style: small uppercase text like its menu links, the chosen language in copper. */
export function SolevoLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${className}`}>
      {(['bn', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30" aria-hidden>/</span>}
          <button
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={language === l}
            lang={l}
            className={`transition-colors ${language === l ? 'text-[var(--sv-gold)]' : 'text-ink/80 hover:text-[var(--sv-gold)]'}`}
          >
            {l === 'bn' ? 'বাং' : 'EN'}
          </button>
        </span>
      ))}
    </div>
  );
}

/** PlayMate's switch, in its header's style: plain uppercase text like the menu links, the chosen language in the accent colour. */
export function PlaymateLanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useStoreLanguageSwitch();
  return (
    <div role="group" aria-label="Language / ভাষা" data-rg="language-switch" className={`flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide ${className}`}>
      {(['bn', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30" aria-hidden>/</span>}
          <button
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={language === l}
            lang={l}
            className={`border-b-2 pb-0.5 transition-colors ${language === l ? 'border-accent text-accent' : 'border-transparent text-ink hover:text-accent'}`}
          >
            {l === 'bn' ? 'বাং' : 'EN'}
          </button>
        </span>
      ))}
    </div>
  );
}
