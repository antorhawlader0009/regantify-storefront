import type { CSSProperties, ReactNode } from 'react';
import type { SectionStyle } from './types';

/**
 * Wraps every rendered section with two shared, theme-independent
 * concerns (landing-plan.md §4.4, §6, Step 11):
 *
 *  1. The common `style?: SectionStyle` slot every section props
 *     interface may carry (landing-page-sections.md's own doc comment:
 *     "Colors/spacing/etc. common to every section... modeled as an
 *     optional shared `style` object").
 *  2. Per-device visibility (`visibility.desktop`/`visibility.mobile`) —
 *     applied here as plain Tailwind responsive display classes
 *     (`hidden md:block` / `md:hidden`), NOT a client-side
 *     useEffect/matchMedia check. This matters specifically because this
 *     whole render tree is Server-Component-first: a section hidden on
 *     mobile must never be visible in the initial server-rendered HTML
 *     on a mobile viewport even for the one frame before JS hydrates —
 *     CSS media queries applied at render time (via Tailwind's `md:`
 *     breakpoint, matching every other responsive class already used
 *     throughout this app) give that for free, with zero JS.
 */
export function SectionShell({
  style,
  visibility,
  id,
  children,
}: {
  style?: SectionStyle;
  visibility?: { desktop: boolean; mobile: boolean };
  id?: string;
  children: ReactNode;
}) {
  const desktopVisible = visibility?.desktop ?? true;
  const mobileVisible = visibility?.mobile ?? true;

  // Four combinations: both visible (nothing to hide), mobile-only-hidden
  // (`hidden md:block`), desktop-only-hidden (`md:hidden`), or both
  // hidden (`hidden` unconditionally — an odd but valid vendor choice,
  // e.g. temporarily disabling a section without deleting it).
  let visibilityClass = '';
  if (!desktopVisible && !mobileVisible) visibilityClass = 'hidden';
  else if (!mobileVisible) visibilityClass = 'hidden md:block';
  else if (!desktopVisible) visibilityClass = 'md:hidden';

  const cssStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor || undefined,
    backgroundImage: style?.backgroundImageUrl ? `url(${style.backgroundImageUrl})` : undefined,
    backgroundSize: style?.backgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: style?.backgroundImageUrl ? 'center' : undefined,
    paddingTop: style?.paddingTop ?? undefined,
    paddingBottom: style?.paddingBottom ?? undefined,
  };

  return (
    <section id={id} className={visibilityClass} style={cssStyle}>
      {children}
    </section>
  );
}
