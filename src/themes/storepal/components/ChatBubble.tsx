'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { isOpenNow, nextOpening, timeLabel, type BusinessHours } from '@/lib/businessHours';
import type { SocialLinks } from '@/lib/socialLinksApi';
import { useCartDrawer } from '../lib/cartDrawer';
import { floatingHideTransform, useFloatingHidden } from '../lib/floatingScroll';
import { FLOATING_BUTTON, useFloatingSlot } from '../lib/floatingStack';
import { useBusinessHours, useStorePalDesign } from '../lib/designSettings';
import { bnDigits, useStoreText } from '../lib/storeText';

type PageKind = 'HOME' | 'PRODUCT' | 'OTHER';

// The page type from the address, whether the store is reached at
// /store/{subdomain}/... or on its own host (the middleware strips that prefix).
function pageKind(pathname: string): PageKind {
  const rest = pathname.replace(/^\/store\/[^/]+/, '');
  if (rest === '' || rest === '/') return 'HOME';
  if (/^\/product\//.test(rest)) return 'PRODUCT';
  return 'OTHER';
}

// "We are closed now, we will reply tomorrow at 10:00 AM" (TellMe idea 73); null while open or with no hours set.
function hoursNote(hours: BusinessHours | null, language: string | undefined): string | null {
  if (!hours || isOpenNow(hours)) return null;
  const next = nextOpening(hours);
  if (!next) return null;
  const bn = language === 'bn';
  const time = bn ? bnDigits(timeLabel(next.from)) : timeLabel(next.from);
  const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const when = next.daysAhead === 0 ? (bn ? 'আজ' : 'today') : next.daysAhead === 1 ? (bn ? 'কাল' : 'tomorrow') : (bn ? BN_DAYS : EN_DAYS)[next.dayIndex];
  return bn ? `এখন আমরা বন্ধ, ${when} ${time}-এ উত্তর দেব।` : `We are closed now. We will reply ${when} at ${time}.`;
}

// WhatsApp's wa.me and api.whatsapp.com links both take the typed-in message as ?text=.
function withText(link: string, text: string): string {
  try {
    const url = new URL(link);
    url.searchParams.set('text', text);
    return url.toString();
  } catch {
    return link;
  }
}

/**
 * The floating chat bubble (Store > Design > Chat Button). WhatsApp opens the
 * link saved in Store > Social; Messenger opens the page link saved on the
 * Chat Button page. It sits bottom-right or bottom-left, only on the page
 * types the vendor picked, and the AI chat widget stacks above it on the
 * right. On a product page the WhatsApp chat opens with "I'd like to know
 * about this product: name, link" already typed, so the vendor can tell which
 * product is being asked about (Messenger links can't carry a message).
 * With nothing saved the settings default to the bubble as it always was:
 * WhatsApp, bottom-right, every page, shown only when a WhatsApp link exists.
 */
export function ChatBubble({ socialLinks, productName }: { socialLinks?: SocialLinks; productName?: string }) {
  const design = useStorePalDesign();
  const hours = useBusinessHours();
  const [closedNow, setClosedNow] = useState(false);
  useEffect(() => {
    setClosedNow(!!hours && !isOpenNow(hours));
  }, [hours]);
  const t = useStoreText();
  const pathname = usePathname() ?? '';
  // Steps over to the left edge while the slide-in cart is open, back when it closes.
  const cartOpen = useCartDrawer((s) => s.open);
  const onLeft = design.chatButtonSide === 'LEFT';
  // Slides off its own side while the shopper scrolls down, back on scroll up.
  const { hidden: scrolledAway, reveal } = useFloatingHidden(cartOpen && !onLeft);

  const pages = design.chatButtonPages ?? ['HOME', 'PRODUCT', 'OTHER'];
  const kind = pageKind(pathname);
  const messenger = design.chatButtonChannel === 'MESSENGER';
  const link = (messenger ? design.chatButtonMessengerLink : socialLinks?.whatsappUrl)?.trim();
  const shown = design.chatButtonEnabled !== false && pages.includes(kind) && !!link;
  // On the right it takes the bottom spot; the AI assistant then sits above it (lib/floatingStack.ts).
  useFloatingSlot(shown, onLeft ? 'left' : 'right');
  if (!shown || !link) return null;

  // Outside the shop hours (TellMe idea 73) the bubble says so and when we answer again; the chat still opens.
  const closedNote = hoursNote(hours, design.storeLanguage);
  const left = onLeft;
  const prefill = !messenger && kind === 'PRODUCT' && !!productName && design.chatButtonProductMessage !== false;

  // The product link is read when tapped, so it is the address the shopper is really on.
  const onClick = prefill
    ? (e: MouseEvent<HTMLAnchorElement>) => {
        const page = `${window.location.origin}${window.location.pathname}`;
        e.currentTarget.href = withText(link, `${t("I'd like to know about this product:")} ${productName}\n${page}`);
      }
    : undefined;

  return (
    <>
    {closedNote && closedNow && !scrolledAway && (
      <p
        // Beside the button (not above it, where the AI assistant's button sits).
        className={`fixed bottom-6 ${left ? 'left-[5.25rem]' : 'right-[5.25rem]'} z-30 m-0 max-w-[15rem] rounded-md bg-ink px-3 py-2 text-[12px] leading-snug text-white shadow-lg`}
        role="status"
      >
        {closedNote}
      </p>
    )}
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={messenger ? 'Chat on Messenger' : 'Chat on WhatsApp'}
      data-rg="chat-button"
      onClick={onClick}
      className={`fixed bottom-5 ${left ? 'left-5' : 'right-5'} z-30 ${FLOATING_BUTTON} flex items-center justify-center transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none ${
        messenger ? 'bg-[#0084FF] hover:bg-[#0074e0]' : 'bg-[#25D366] hover:bg-[#20bd5a]'
      }`}
      onFocus={reveal}
      style={{
        transform:
          cartOpen && !left
            ? 'translateX(calc(-100vw + 5.5rem))'
            : scrolledAway
              ? floatingHideTransform(left ? 'left' : 'right')
              : undefined,
      }}
    >
      {messenger ? (
        <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
          <path
            fill="white"
            d="M12 2C6.48 2 2 6.14 2 11.25c0 2.9 1.45 5.48 3.72 7.17V22l3.4-1.87c.93.26 1.9.4 2.88.4 5.52 0 10-4.14 10-9.25S17.52 2 12 2z"
          />
          <path fill="#0084FF" d="M5.9 14.2l4.4-4.67 2.5 2.5 4.3-2.5-4.4 4.67-2.5-2.5-4.3 2.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 32 32" width="27" height="27" fill="white" aria-hidden="true">
          <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.674 4.524 1.84 6.37L4 29l7.84-1.79A11.93 11.93 0 0 0 16.004 27C22.632 27 28 21.627 28 15S22.632 3 16.004 3zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.65 1.06 1.08-4.53-.23-.37A9.72 9.72 0 0 1 6.25 15c0-5.38 4.38-9.75 9.754-9.75 5.375 0 9.746 4.37 9.746 9.75s-4.371 9.75-9.746 9.75zm5.34-7.29c-.293-.147-1.734-.855-2.003-.953-.269-.098-.465-.147-.66.147-.196.293-.758.953-.93 1.148-.171.196-.343.22-.636.073-.293-.147-1.237-.456-2.357-1.455-.871-.777-1.46-1.737-1.631-2.03-.171-.293-.018-.452.128-.598.132-.131.293-.343.44-.514.147-.171.196-.293.293-.489.098-.196.049-.367-.024-.514-.073-.147-.66-1.591-.905-2.18-.238-.572-.481-.494-.66-.503-.171-.008-.367-.01-.563-.01a1.08 1.08 0 0 0-.783.367c-.269.293-1.026 1.002-1.026 2.444s1.05 2.835 1.196 3.031c.147.196 2.066 3.155 5.006 4.424.7.302 1.246.483 1.672.618.702.223 1.34.192 1.845.116.563-.084 1.734-.709 1.978-1.393.244-.685.244-1.271.171-1.393-.073-.123-.269-.196-.563-.343z" />
        </svg>
      )}
    </a>
    </>
  );
}
