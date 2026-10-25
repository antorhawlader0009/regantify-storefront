'use client';

/**
 * The voice call's screen (lib/voice/useVoiceCall.ts), in the look of a messaging app's call: dark background, the
 * store's round avatar that pulses with the voice, "Calling..." / "Ringing..." / a call timer, round mute and red
 * hang-up buttons. Full screen on a phone, a phone-sized card in the corner on a computer.
 *
 * While ringing the avatar is big in the middle. Once talking it shrinks into a header row, and the rest is ONE vertical
 * scroll area: the captions, then the products the assistant is showing (one product big, several as a list). A product
 * opens in this tab (the widget lives in the store layout, so the call goes on) and the call shrinks to a round chat head
 * (CallChatHead) that the shopper can drag anywhere.
 *
 * Shared by every template: the template passes the call, the store name, the cart summary and its checkout.
 */
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, ShoppingBag, Camera, ChevronRight, Minimize2 } from 'lucide-react';
import type { VoiceCall } from '@/lib/voice/useVoiceCall';
import { CallCamera } from './CallCamera';

export interface CallProduct {
  slug: string;
  name: string;
  photoUrl: string | null;
  /** A number, or the API's decimal string. */
  price: number | string;
}

const two = (n: number) => String(n).padStart(2, '0');
const clock = (s: number) => `${two(Math.floor(s / 60))}:${two(s % 60)}`;
const BN = '০১২৩৪৫৬৭৮৯';
const bnDigits = (s: string) => s.replace(/\d/g, (d) => BN[Number(d)]);
const taka = (v: number | string) => `৳${bnDigits(Number(v).toLocaleString('en-IN'))}`;

const HEAD = 64; // the chat head's size, px
const EDGE = 10; // its gap to the screen edge when it snaps
const TAP_MOVE = 8; // moved less than this: a tap, not a drag
const POS_KEY = 'regantify-call-head';

/** Where the head sits: x is the left edge (snapped left or right), y the top; kept for the tab (sessionStorage). */
function savedPos(): { x: number; y: number } | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(POS_KEY) ?? 'null') as { x: number; y: number } | null;
    return p && typeof p.x === 'number' && typeof p.y === 'number' ? p : null;
  } catch {
    return null;
  }
}

function clampPos(x: number, y: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return { x: Math.min(Math.max(EDGE, x), w - HEAD - EDGE), y: Math.min(Math.max(EDGE + 40, y), h - HEAD - 70) };
}

/**
 * The minimised call as a chat head (the user's request, 2026-10-25): a round button with the store's initial that pulses
 * while the assistant talks, the call timer under it, and a mute mark. Drag with a finger or mouse (pointer events, so
 * the page doesn't scroll while dragging); on release it snaps to the nearer side. While dragging, a red circle at the
 * bottom appears: dropping the head on it ends the call. A tap (barely moved) opens the full call screen again.
 */
function CallChatHead<P extends CallProduct>({
  call,
  storeName,
  initial,
  status,
  talkLabel,
}: {
  call: VoiceCall<P>;
  storeName: string;
  initial: string;
  status: string;
  talkLabel: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const p = typeof window === 'undefined' ? null : savedPos();
    if (p) return clampPos(p.x, p.y);
    return typeof window === 'undefined' ? { x: 0, y: 120 } : clampPos(window.innerWidth - HEAD - EDGE, window.innerHeight * 0.28);
  });
  const [dragging, setDragging] = useState(false);
  const [overEnd, setOverEnd] = useState(false);
  const drag = useRef<{ id: number; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const headRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  // The ring follows the assistant's voice, like the big avatar.
  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const frame = () => {
      smooth = smooth * 0.75 + call.level() * 0.25;
      if (ringRef.current) ringRef.current.style.transform = `scale(${1 + smooth * 0.5})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [call.level]);

  // Stays on screen when the phone turns or the window is resized.
  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p.x > window.innerWidth / 2 ? window.innerWidth : 0, p.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const endZone = () => ({ x: window.innerWidth / 2, y: window.innerHeight - 80 });
  const nearEnd = (x: number, y: number) => {
    const z = endZone();
    return Math.hypot(x + HEAD / 2 - z.x, y + HEAD / 2 - z.y) < 70;
  };

  const onDown = (e: React.PointerEvent) => {
    headRef.current?.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < TAP_MOVE) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    const x = e.clientX - d.dx;
    const y = e.clientY - d.dy;
    setPos({ x, y });
    setOverEnd(nearEnd(x, y));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      call.setMinimized(false);
      return;
    }
    setDragging(false);
    setOverEnd(false);
    const x = e.clientX - d.dx;
    const y = e.clientY - d.dy;
    if (nearEnd(x, y)) {
      call.hangUp();
      return;
    }
    // Snap to the nearer side, like a chat head.
    const snapped = clampPos(x + HEAD / 2 < window.innerWidth / 2 ? 0 : window.innerWidth, y);
    setPos(snapped);
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify(snapped));
    } catch {
      /* private mode */
    }
  };

  return (
    <>
      {dragging && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[59] flex h-40 items-end justify-center bg-gradient-to-t from-black/45 to-transparent pb-10" aria-hidden>
          <span
            className={`flex items-center justify-center rounded-full bg-[#f15c6d] text-white shadow-xl transition-transform duration-150 ${overEnd ? 'h-[76px] w-[76px] scale-110' : 'h-14 w-14'}`}
          >
            <PhoneOff size={overEnd ? 28 : 22} />
          </span>
        </div>
      )}
      <div
        className={`fixed z-[60] flex flex-col items-center ${dragging ? '' : 'transition-[left,top] duration-200 ease-out'}`}
        style={{ left: pos.x, top: pos.y, width: HEAD }}
      >
        <button
          ref={headRef}
          type="button"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              call.setMinimized(false);
            }
          }}
          aria-label={`Voice call with ${storeName}, ${status}, ${talkLabel}. Tap to open, drag to move.`}
          className={`relative flex items-center justify-center rounded-full bg-[#00a884] text-[24px] font-semibold text-white shadow-2xl ring-2 ring-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
          style={{ width: HEAD, height: HEAD, touchAction: 'none', opacity: overEnd ? 0.6 : 1 }}
        >
          <span ref={ringRef} className="pointer-events-none absolute inset-0 rounded-full bg-[#00a884]/40 transition-transform duration-75" aria-hidden />
          <span className="relative">{initial}</span>
          {call.muted && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#f15c6d] shadow" aria-hidden>
              <MicOff size={13} />
            </span>
          )}
        </button>
        {!dragging && (
          <span className="mt-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white shadow" aria-hidden>
            {status}
          </span>
        )}
      </div>
    </>
  );
}

export function VoiceCallScreen<P extends CallProduct>({
  call,
  storeName,
  productHref,
  cart,
  checkout,
}: {
  call: VoiceCall<P>;
  storeName: string;
  productHref: (slug: string) => string;
  /** What is in the cart now (the assistant adds to it), or null when empty. */
  cart?: { count: number; total: number } | null;
  /** The shopper's own button to open the filled-in checkout (the assistant never does it). */
  checkout?: { onClick: () => void; busy: boolean } | null;
}) {
  const ringRef = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  // The avatar's rings follow the voice (the assistant's loudness, or a pulse while the shopper is heard).
  useEffect(() => {
    if (call.phase !== 'connected') return;
    let raf = 0;
    let smooth = 0;
    const frame = () => {
      smooth = smooth * 0.75 + call.level() * 0.25;
      if (ringRef.current) ringRef.current.style.transform = `scale(${1 + smooth * 0.35})`;
      if (ring2Ref.current) ring2Ref.current.style.transform = `scale(${1 + smooth * 0.7})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [call.phase, call.level]);

  // New captions and products come into view, unless the shopper scrolled up to look at something.
  useEffect(() => {
    stick.current = true;
  }, [call.products]);
  useEffect(() => {
    const box = scrollRef.current;
    if (box && stick.current) requestAnimationFrame(() => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }));
  }, [call.lines, call.products]);

  if (call.phase === 'idle') return null;

  const initial = storeName.trim().charAt(0).toUpperCase() || '?';
  const ringing = call.phase === 'calling' || call.phase === 'ringing';
  const talking = call.phase === 'connected';
  const status = call.phase === 'calling' ? 'কল করা হচ্ছে…' : call.phase === 'ringing' ? 'রিং হচ্ছে…' : call.phase === 'ended' ? 'কল শেষ' : bnDigits(clock(call.seconds));
  const talkLabel = call.muted ? 'মাইক বন্ধ' : call.talk === 'thinking' ? 'ভাবছি…' : call.talk === 'speaking' ? 'বলছি…' : 'শুনছি…';

  const avatar = (size: 'big' | 'small') => (
    <div className={`relative flex shrink-0 items-center justify-center ${size === 'big' ? 'h-36 w-36' : 'h-14 w-14'}`}>
      <div ref={ring2Ref} className="absolute inset-0 rounded-full bg-[#00a884]/10 transition-transform duration-75" />
      <div ref={ringRef} className={`absolute rounded-full bg-[#00a884]/20 transition-transform duration-75 ${size === 'big' ? 'inset-3' : 'inset-1'}`} />
      {ringing && <div className="absolute inset-3 animate-ping rounded-full bg-[#00a884]/20 [animation-duration:2s]" />}
      <div
        className={`relative flex items-center justify-center rounded-full bg-[#00a884] font-semibold shadow-lg ${size === 'big' ? 'h-28 w-28 text-[44px]' : 'h-11 w-11 text-[18px]'}`}
      >
        {initial}
      </div>
    </div>
  );

  // Shrunk while the shopper looks at a page opened from the call: a round chat head, like Messenger's, that can be
  // dragged anywhere with a finger; a tap brings the full screen back, dropping it on the red circle ends the call.
  if (call.minimized && talking && !call.camera) {
    return <CallChatHead call={call} storeName={storeName} initial={initial} status={status} talkLabel={talkLabel} />;
  }

  return (
    <div
      role="dialog"
      aria-label={`Voice call with ${storeName}`}
      className="fixed inset-0 z-[60] flex flex-col text-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(680px,calc(100vh-40px))] sm:w-[380px] sm:overflow-hidden sm:rounded-3xl sm:shadow-2xl"
      style={{ background: 'linear-gradient(180deg, #0b141a 0%, #111b21 55%, #0b141a 100%)' }}
    >
      {call.camera && <CallCamera onPhoto={call.submitPhoto} onCancel={call.cancelCamera} />}

      {talking ? (
        // Talking: a compact header row, so the captions and products get the space.
        <div className="flex items-center gap-3 border-b border-white/10 px-4 pb-3 pt-[max(env(safe-area-inset-top),14px)]">
          {avatar('small')}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold">{storeName}</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-white/65" aria-live="polite">
              <span className="tabular-nums">{status}</span>
              <span aria-hidden>·</span>
              {call.talk === 'thinking' && !call.muted && <Loader2 size={11} className="animate-spin" />}
              <span>{talkLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => call.setMinimized(true)}
            aria-label="Minimise the call"
            title="ছোট করুন, পেজ দেখুন"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
          >
            <Minimize2 size={16} />
          </button>
          {cart && cart.count > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium" title="কার্টে আছে">
              <ShoppingBag size={14} />
              {bnDigits(String(cart.count))} · {taka(cart.total)}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 pt-[max(env(safe-area-inset-top),20px)]">
          <p className="text-[12px] tracking-wide text-white/55">ভয়েস কল · শপিং অ্যাসিস্ট্যান্ট</p>
          <div className="mt-10">{avatar('big')}</div>
          <h2 className="mt-5 max-w-full truncate text-[22px] font-semibold">{storeName}</h2>
          <p className="mt-1 text-[15px] tabular-nums text-white/70" aria-live="polite">
            {status}
          </p>
          {ringing && call.loadPct !== null && call.loadPct < 100 && (
            <p className="mt-2 text-[11.5px] text-white/45">কণ্ঠ প্রস্তুত হচ্ছে {bnDigits(String(call.loadPct))}%</p>
          )}
        </div>
      )}

      {/* One vertical scroll area: captions, then what the assistant is showing. */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const b = e.currentTarget;
          stick.current = b.scrollHeight - b.scrollTop - b.clientHeight < 60;
        }}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]"
      >
        {call.phase === 'ended' && call.problem ? (
          <p className="rounded-xl bg-red-500/15 px-4 py-3 text-center text-[14px] text-red-100">{call.problem}</p>
        ) : (
          <>
            {call.lines.map((l, i) => (
              <p
                key={i}
                className={
                  l.who === 'assistant'
                    ? 'max-w-[88%] self-start rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2 text-[14px] leading-relaxed text-white/90'
                    : 'max-w-[88%] self-end rounded-2xl rounded-tr-sm bg-[#005c4b] px-3.5 py-2 text-[14px] leading-relaxed text-white/90'
                }
              >
                {l.text}
              </p>
            ))}

            {talking && call.products.length === 1 && (
              // One product: shown big, like holding it up to the customer.
              <a
                href={productHref(call.products[0].slug)}
                onClick={(e) => {
                  e.preventDefault();
                  void call.openProduct(call.products[0]);
                }}
                className="mt-1 block shrink-0 overflow-hidden rounded-2xl bg-white/10 hover:bg-white/15"
              >
                <span className="flex h-52 w-full items-center justify-center bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- product photo from the store's CDN */}
                  {call.products[0].photoUrl && <img src={call.products[0].photoUrl} alt={call.products[0].name} className="h-full w-full object-contain" />}
                </span>
                <span className="flex items-center gap-2 px-3.5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-medium leading-snug text-white">{call.products[0].name}</span>
                    <span className="mt-0.5 block text-[15px] font-semibold text-[#25d366]">{taka(call.products[0].price)}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white/85">
                    দেখুন <ChevronRight size={13} />
                  </span>
                </span>
              </a>
            )}

            {talking && call.products.length > 1 && (
              <div className="mt-1 flex shrink-0 flex-col gap-2">
                <p className="text-[11.5px] font-medium uppercase tracking-wide text-white/45">স্ক্রিনে দেখানো পণ্য</p>
                {call.products.map((p, i) => (
                  <a
                    key={p.slug}
                    href={productHref(p.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      void call.openProduct(p);
                    }}
                    className="flex items-center gap-3 rounded-xl bg-white/10 p-2 hover:bg-white/15"
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- product photo from the store's CDN */}
                      {p.photoUrl && <img src={p.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] font-bold">
                        {bnDigits(String(i + 1))}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13.5px] leading-snug text-white/95">{p.name}</span>
                      <span className="mt-0.5 block text-[13.5px] font-semibold text-[#25d366]">{taka(p.price)}</span>
                    </span>
                    <ChevronRight size={16} className="mr-1 shrink-0 text-white/40" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Phones don't listen while the assistant speaks (its voice came back as the shopper's words), so cutting in is a tap. */}
      {call.halfDuplex && talking && call.talk === 'speaking' && (
        <div className="flex justify-center px-4 pb-1">
          <button
            type="button"
            onClick={call.interrupt}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-[14px] font-medium hover:bg-white/20"
          >
            <Mic size={16} />
            থামিয়ে আমি বলি
          </button>
        </div>
      )}

      {checkout && talking && (
        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={checkout.onClick}
            disabled={checkout.busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-[15px] font-semibold text-[#0b141a] disabled:opacity-60"
          >
            {checkout.busy ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
            অর্ডার করতে চাপুন
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-4">
        {call.phase === 'ended' ? (
          call.problem ? (
            <button type="button" onClick={call.close} className="rounded-full bg-white/15 px-6 py-3 text-[15px] font-semibold hover:bg-white/20">
              বন্ধ করুন
            </button>
          ) : null
        ) : (
          <>
            <button
              type="button"
              onClick={() => call.setLang(call.lang === 'bn-BD' ? 'en-US' : 'bn-BD')}
              disabled={!talking}
              aria-label={call.lang === 'bn-BD' ? 'Listening in Bangla, switch to English' : 'Listening in English, switch to Bangla'}
              title="কোন ভাষায় বলছেন"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold hover:bg-white/15 disabled:opacity-40"
            >
              {call.lang === 'bn-BD' ? 'বাং' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => call.setMuted(!call.muted)}
              disabled={!talking}
              aria-pressed={call.muted}
              aria-label={call.muted ? 'Unmute' : 'Mute'}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${call.muted ? 'bg-white text-[#0b141a]' : 'bg-white/10 hover:bg-white/15'}`}
            >
              {call.muted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            {call.canPhotoSearch && (
              <button
                type="button"
                onClick={call.openCamera}
                disabled={!talking}
                aria-label="Search with a photo"
                title="ছবি দিয়ে খুঁজুন"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-40"
              >
                <Camera size={22} />
              </button>
            )}
            <button
              type="button"
              onClick={() => call.hangUp()}
              aria-label="End call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f15c6d] shadow-lg hover:bg-[#e04b5c]"
            >
              <PhoneOff size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
