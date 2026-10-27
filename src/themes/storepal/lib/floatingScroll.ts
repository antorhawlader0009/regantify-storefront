'use client';

import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

// The floating buttons (AI assistant, chat bubble) slide off to their side while the shopper
// scrolls down to read, and come back the moment they scroll up, the same "hide on scroll down,
// show on scroll up" rule Material Design gives floating action buttons and most store chat
// widgets follow. Near the top of the page they always show. One scroll listener drives every
// button, however many are mounted.

/** Always shown above this many pixels from the top. */
const TOP_ZONE = 120;
/** Pixels of scroll in one direction before the buttons react, so a finger's wobble does nothing. */
const MIN_TRAVEL = 12;

interface FloatingScrollState {
  hidden: boolean;
  /** Brings the buttons back at once, e.g. when one gets keyboard focus. */
  reveal: () => void;
}

const useFloatingScrollStore = create<FloatingScrollState>((set) => ({
  hidden: false,
  reveal: () => set({ hidden: false }),
}));

let listeners = 0;
let detach: (() => void) | null = null;

function attach() {
  let lastY = Math.max(0, window.scrollY);
  // Where the current run of scrolling in one direction began.
  let anchorY = lastY;
  let goingDown = false;
  let frame = 0;

  const update = () => {
    frame = 0;
    // Clamp: iOS rubber-band scrolling reports negative values and values past the end.
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.min(Math.max(0, window.scrollY), maxY);
    if (y === lastY) return;

    const down = y > lastY;
    if (down !== goingDown) {
      goingDown = down;
      anchorY = lastY;
    }
    lastY = y;

    const { hidden } = useFloatingScrollStore.getState();
    let next = hidden;
    if (y <= TOP_ZONE) next = false;
    else if (Math.abs(y - anchorY) >= MIN_TRAVEL) next = down;
    if (next !== hidden) useFloatingScrollStore.setState({ hidden: next });
  };

  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', onScroll);
    if (frame) window.cancelAnimationFrame(frame);
  };
}

/**
 * The phone header's category strip: hidden while the shopper scrolls down, back on scroll up (the user's request,
 * 2026-10-27). Its own rule, not the floating buttons': the strip is part of the sticky header, so hiding it makes the
 * page jump up by its height, which the browser reports as a scroll up and would bring it straight back (the shaking
 * seen on 2026-10-27). So: after each change, scroll moves are ignored while the strip folds (STRIP_SETTLE_MS) and the
 * position is measured again from there; it needs a real run of STRIP_TRAVEL pixels (more than its own height) to
 * change again; and it only hides below STRIP_TOP_ZONE. `pinned` keeps it shown.
 */
const STRIP_TOP_ZONE = 160;
const STRIP_TRAVEL = 60;
const STRIP_SETTLE_MS = 400;

export function useStripHidden(pinned = false): boolean {
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  useEffect(() => {
    if (pinned) {
      hiddenRef.current = false;
      setHidden(false);
      return;
    }
    let lastY = Math.max(0, window.scrollY);
    let anchorY = lastY;
    let goingDown = false;
    let settleUntil = 0;
    let frame = 0;
    const set = (next: boolean) => {
      if (next === hiddenRef.current) return;
      hiddenRef.current = next;
      setHidden(next);
      // The strip's own fold moves the page: wait for it, then measure from wherever the page ended up.
      settleUntil = performance.now() + STRIP_SETTLE_MS;
    };
    const update = () => {
      frame = 0;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(Math.max(0, window.scrollY), maxY);
      if (performance.now() < settleUntil) {
        lastY = anchorY = y;
        return;
      }
      if (y === lastY) return;
      const down = y > lastY;
      if (down !== goingDown) {
        goingDown = down;
        anchorY = lastY;
      }
      lastY = y;
      if (y <= STRIP_TOP_ZONE) set(false);
      else if (Math.abs(y - anchorY) >= STRIP_TRAVEL) set(down);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pinned]);
  return hidden;
}

/**
 * True while the floating buttons should be tucked away. Pass `pinned` when a button must stay
 * (its panel is open, the cart drawer has moved it), so it never slides away under the shopper.
 */
export function useFloatingHidden(pinned = false): { hidden: boolean; reveal: () => void } {
  const hidden = useFloatingScrollStore((s) => s.hidden);
  const reveal = useFloatingScrollStore((s) => s.reveal);

  useEffect(() => {
    if (listeners++ === 0) detach = attach();
    return () => {
      if (--listeners === 0 && detach) {
        detach();
        detach = null;
        useFloatingScrollStore.setState({ hidden: false });
      }
    };
  }, []);

  return { hidden: hidden && !pinned, reveal };
}

/** The transform that slides a floating button off its own edge of the screen. */
export function floatingHideTransform(side: 'left' | 'right'): string {
  return side === 'right' ? 'translateX(calc(100% + 2rem))' : 'translateX(calc(-100% - 2rem))';
}
