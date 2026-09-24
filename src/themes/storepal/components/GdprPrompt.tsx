'use client';

import { useEffect, useState } from 'react';
import type { StorefrontGdprPrompt } from '@/lib/storefrontApi';
import { grantGdprConsent, hasGdprConsent } from '@/lib/gdprConsent';

// Shown when the vendor enabled the prompt but left the message blank —
// keep in sync with client's pages/vendor/store/GdprPrompt.tsx placeholder.
const DEFAULT_MESSAGE_HTML =
  '<p><strong>We Care About Your Privacy</strong></p><p>We use cookies to enhance your browsing experience in our site and offer personalized promotions.</p>';

const POSITION_CLASSES: Record<StorefrontGdprPrompt['position'], string> = {
  BOTTOM: 'inset-x-0 bottom-0 border-t',
  TOP: 'inset-x-0 top-0 border-b',
  BOTTOM_LEFT: 'bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm rounded-lg border shadow-popover',
  BOTTOM_RIGHT: 'bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm rounded-lg border shadow-popover',
};

/**
 * Store > GDPR Prompt — StorePal's cookie-consent banner, mounted once in
 * store/[subdomain]/layout.tsx for StorePal stores only (like the AI chat
 * widget, other themes don't get it). The shopper's accept is remembered
 * per store in localStorage (lib/gdprConsent.ts) and never sent to the
 * server; the Meta pixel waits for it (lib/metaPixel.ts). Renders nothing
 * until mounted, so server HTML and first client render always match.
 *
 * `message` is the vendor's own RichTextEditor HTML, rendered raw — same
 * trust level as Store > Footer's aboutBlurb (see StoreFooter.tsx).
 */
export function GdprPrompt({ subdomain, prompt }: { subdomain: string; prompt: StorefrontGdprPrompt }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Storage blocked (private mode etc.) reads as "not accepted", so the
    // prompt shows; accepting then just hides it for this page view.
    setVisible(!hasGdprConsent(subdomain));
  }, [subdomain]);

  if (!visible) return null;

  const accept = () => {
    grantGdprConsent(subdomain);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={`fixed z-[60] border-black/10 ${POSITION_CLASSES[prompt.position] ?? POSITION_CLASSES.BOTTOM}`}
      style={{ backgroundColor: prompt.backgroundColor, color: prompt.textColor }}
    >
      <div
        className={`flex flex-col gap-3 p-4 ${
          prompt.position === 'BOTTOM' || prompt.position === 'TOP'
            ? 'sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto sm:px-6'
            : ''
        }`}
      >
        <div
          className="text-[13px] leading-relaxed [&_p]:m-0 [&_p+p]:mt-1 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: prompt.message || DEFAULT_MESSAGE_HTML }}
        />
        <button
          type="button"
          onClick={accept}
          className="shrink-0 self-start sm:self-auto px-5 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-semibold transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
