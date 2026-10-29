'use client';

/**
 * The voice call on screen (lib/voice/useVoiceCall.ts): only a round chat head over the real store, like Messenger's
 * (the user's rule, 2026-10-27). There is no call screen: everything the assistant shows goes on the store's own pages
 * (a product's page, the results page, the cart), so the head floats above them from the first ring.
 *
 * The head has the store's initial, a ring that follows the assistant's voice, and the call timer under it. Drag it
 * anywhere with a finger or mouse; it snaps to the nearer side, and dropping it on the red circle that appears at the
 * bottom ends the call. A tap opens a small card beside it with mute, the listening language, photo search and hang up.
 * The latest spoken line shows for a moment as a speech bubble next to the head, and the shopper's own buttons (stop
 * the assistant on a phone, order) sit under it.
 *
 * Shared by every template: the template passes the call, the store name, the cart summary and its checkout.
 */
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, ShoppingBag, Camera, X } from 'lucide-react';
import type { VoiceCall } from '@/lib/voice/useVoiceCall';

export interface CallProduct {
  slug: string;
  name: string;
  photoUrl: string | null;
  /** A number, or the API's decimal string. */
  price: number | string;
}

const two = (n: number) => String(n).padStart(2, '0');
const clock = (s: number) => `${two(Math.floor(s / 60))}:${two(s % 60)}`;
// Numbers are always shown in English digits, also in Bangla text (the owner's rule, 2026-10-29).
const bnDigits = (s: string) => s;
const taka = (v: number | string) => `৳${bnDigits(Number(v).toLocaleString('en-IN'))}`;

const HEAD = 64; // the chat head's size, px
const EDGE = 10; // its gap to the screen edge when it snaps
const TAP_MOVE = 8; // moved less than this: a tap, not a drag
const POS_KEY = 'regantify-call-head';
const CAPTION_MS = 6000; // how long a spoken line stays beside the head
const MIC_HINT_MS = 1800; // still "calling" this long: the browser is asking for the microphone, say so

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
  return { x: Math.min(Math.max(EDGE, x), w - HEAD - EDGE), y: Math.min(Math.max(EDGE + 40, y), h - HEAD - 110) };
}

export function VoiceCallScreen<P extends CallProduct>({
  call,
  storeName,
  cart,
  checkout,
  onPickPhoto,
}: {
  call: VoiceCall<P>;
  storeName: string;
  /** What is in the cart now (the assistant adds to it), or null when empty. */
  cart?: { count: number; total: number } | null;
  /** The shopper's own button to open the filled-in checkout (the assistant never does it). */
  checkout?: { onClick: () => void; busy: boolean } | null;
  /**
   * The card's photo button: the picture the shopper picks goes to the store's own photo search (its results show in
   * the search's results, and the call hears them). Without it the button only says where the search's photo button is.
   */
  onPickPhoto?: (file: File) => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const p = typeof window === 'undefined' ? null : savedPos();
    if (p) return clampPos(p.x, p.y);
    return typeof window === 'undefined' ? { x: 0, y: 120 } : clampPos(window.innerWidth - HEAD - EDGE, window.innerHeight * 0.28);
  });
  const [dragging, setDragging] = useState(false);
  const [overEnd, setOverEnd] = useState(false);
  const [panel, setPanel] = useState(false);
  const [caption, setCaption] = useState<{ who: 'assistant' | 'shopper'; text: string } | null>(null);
  // The browser's microphone question can sit unnoticed at the top of the window; the head points to it.
  const [micHint, setMicHint] = useState(false);
  const drag = useRef<{ id: number; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const headRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // The ring follows the assistant's voice (or a soft pulse while the shopper is heard).
  useEffect(() => {
    if (call.phase === 'idle') return;
    let raf = 0;
    let smooth = 0;
    const frame = () => {
      smooth = smooth * 0.75 + call.level() * 0.25;
      if (ringRef.current) ringRef.current.style.transform = `scale(${1 + smooth * 0.5})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [call.phase, call.level]);

  // Stays on screen when the phone turns or the window is resized.
  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p.x > window.innerWidth / 2 ? window.innerWidth : 0, p.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // The latest line (the assistant's answer or the shopper's words) beside the head, for a few seconds.
  const last = call.lines[call.lines.length - 1];
  useEffect(() => {
    if (!last?.text) return;
    setCaption(last);
    const t = setTimeout(() => setCaption(null), CAPTION_MS);
    return () => clearTimeout(t);
  }, [last?.who, last?.text]);

  useEffect(() => {
    if (call.phase !== 'calling') return setMicHint(false);
    const t = setTimeout(() => setMicHint(true), MIC_HINT_MS);
    return () => clearTimeout(t);
  }, [call.phase]);

  // The card closes on a tap anywhere else, and when the call ends.
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || headRef.current?.contains(t)) return;
      setPanel(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [panel]);
  useEffect(() => {
    if (call.phase === 'idle' || call.phase === 'ended') setPanel(false);
  }, [call.phase]);

  if (call.phase === 'idle') return null;

  const initial = storeName.trim().charAt(0).toUpperCase() || '?';
  const ringing = call.phase === 'calling' || call.phase === 'ringing';
  const talking = call.phase === 'connected';
  const status = call.phase === 'calling' ? 'কল হচ্ছে…' : call.phase === 'ringing' ? 'রিং হচ্ছে…' : call.phase === 'ended' ? 'কল শেষ' : bnDigits(clock(call.seconds));
  const talkLabel = call.muted ? 'মাইক বন্ধ' : call.talk === 'thinking' ? 'ভাবছি…' : call.talk === 'speaking' ? 'বলছি…' : 'শুনছি…';

  // The call couldn't go on (no microphone...): a small note in place of the head, closed by the shopper.
  if (call.phase === 'ended' && call.problem) {
    return (
      <div role="alert" className="fixed bottom-24 left-1/2 z-[60] flex w-[min(340px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-2xl bg-[#111b21] px-4 py-3 text-white shadow-2xl">
        <PhoneOff size={18} className="mt-0.5 shrink-0 text-[#f15c6d]" />
        <p className="flex-1 text-[13.5px] leading-snug">{call.problem}</p>
        <button type="button" onClick={call.close} aria-label="Close" className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </div>
    );
  }

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
      setPanel(false);
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
      setPanel((p) => !p);
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

  // The head's side decides where the speech bubble and the card open (towards the middle of the screen).
  const onRight = typeof window !== 'undefined' && pos.x + HEAD / 2 > window.innerWidth / 2;
  const side = onRight ? 'right-full mr-3' : 'left-full ml-3';
  const stopButton = call.halfDuplex && talking && call.talk === 'speaking';
  const roundButton = 'flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-40';
  const controlCell = 'flex w-14 flex-col items-center gap-1 text-[10.5px] leading-tight text-white/60';

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
        <div className="relative">
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
                setPanel((p) => !p);
              }
            }}
            aria-expanded={panel}
            aria-label={`Voice call with the AI assistant of ${storeName}, ${status}, ${talkLabel}. Tap for call controls, drag to move.`}
            className={`relative flex items-center justify-center rounded-full bg-accent text-[24px] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(16,24,40,0.35),0_18px_40px_-10px_rgba(16,24,40,0.45)] ring-[3px] ring-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
            style={{ width: HEAD, height: HEAD, touchAction: 'none', opacity: overEnd ? 0.6 : 1 }}
          >
            <span ref={ringRef} className="pointer-events-none absolute -inset-1 rounded-full bg-accent/30 transition-transform duration-75" aria-hidden />
            {ringing && <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-accent/35 [animation-duration:1.6s]" aria-hidden />}
            <span className="relative">{talking && call.talk === 'thinking' && !call.muted ? <Loader2 size={24} className="animate-spin" /> : initial}</span>
            {call.muted && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#f15c6d] shadow" aria-hidden>
                <MicOff size={13} />
              </span>
            )}
            {/* A green phone: this is a call, not the chat bubble. */}
            <span className="absolute -bottom-0.5 -left-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#25d366] text-white ring-2 ring-white" aria-hidden>
              <Phone size={11} strokeWidth={2.6} className={ringing ? 'animate-pulse' : undefined} />
            </span>
          </button>

          {/* The latest spoken line, beside the head. */}
          {micHint && !panel && !dragging && (
            <p
              role="status"
              className={`pointer-events-none absolute top-1 ${side} w-max max-w-[min(240px,calc(100vw-110px))] rounded-2xl bg-[#111b21]/90 px-3 py-2 text-[13px] leading-snug text-white shadow-xl`}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <Mic size={14} />
                মাইক্রোফোন চালু করুন
              </span>
              <span className="mt-0.5 block text-white/75">উপরে ব্রাউজার অনুমতি চাইছে, “Allow” চাপুন।</span>
            </p>
          )}
          {caption && !micHint && !panel && !dragging && (
            <p
              aria-live="polite"
              className={`pointer-events-none absolute top-1 ${side} w-max max-w-[min(240px,calc(100vw-110px))] rounded-2xl px-3 py-2 text-[13px] leading-snug text-white shadow-xl ${
                caption.who === 'assistant' ? 'bg-[#111b21]/90' : 'bg-[#005c4b]/95'
              }`}
            >
              <span className="line-clamp-4">{caption.text}</span>
            </p>
          )}

          {/* Call controls, opened by a tap on the head. */}
          {panel && (
            <div
              ref={panelRef}
              role="dialog"
              aria-label={`Voice call with ${storeName}`}
              className={`absolute top-0 ${side} w-[min(260px,calc(100vw-100px))] rounded-2xl bg-[#111b21] p-3 text-white shadow-2xl`}
            >
              <p className="truncate text-[14.5px] font-semibold">{storeName}</p>
              {/* Always said plainly: the shopper is talking to an AI, not a person. */}
              <p className="text-[11.5px] font-medium text-[#25d366]">এআই সহকারী</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/65">
                <span className="tabular-nums">{status}</span>
                {talking && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{talkLabel}</span>
                  </>
                )}
              </p>
              {ringing && call.loadPct !== null && call.loadPct < 100 && (
                <p className="mt-1 text-[11.5px] text-white/45">কণ্ঠ প্রস্তুত হচ্ছে {bnDigits(String(call.loadPct))}%</p>
              )}
              {cart && cart.count > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium">
                  <ShoppingBag size={13} />
                  কার্টে {bnDigits(String(cart.count))} · {taka(cart.total)}
                </p>
              )}
              {/* Each button has its word under it: shoppers on a call shouldn't have to guess what an icon does. */}
              <div className="mt-3 flex items-start justify-between gap-1">
                <span className={controlCell}>
                  <button
                    type="button"
                    onClick={() => call.setLang(call.lang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                    disabled={!talking}
                    aria-label={call.lang === 'bn-BD' ? 'Listening in Bangla, switch to English' : 'Listening in English, switch to Bangla'}
                    className={`${roundButton} bg-white/10 text-[12px] font-semibold hover:bg-white/15`}
                  >
                    {call.lang === 'bn-BD' ? 'বাং' : 'EN'}
                  </button>
                  <span aria-hidden>ভাষা</span>
                </span>
                <span className={controlCell}>
                  <button
                    type="button"
                    onClick={() => call.setMuted(!call.muted)}
                    disabled={!talking}
                    aria-pressed={call.muted}
                    aria-label={call.muted ? 'Unmute' : 'Mute'}
                    className={`${roundButton} ${call.muted ? 'bg-white text-[#0b141a]' : 'bg-white/10 hover:bg-white/15'}`}
                  >
                    {call.muted ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>
                  <span aria-hidden>{call.muted ? 'মাইক বন্ধ' : 'মাইক'}</span>
                </span>
                {call.canPhotoSearch && (
                  <span className={controlCell}>
                    <button
                      type="button"
                      onClick={() => {
                        setPanel(false);
                        // A tap may open the picture picker (a voice request can't, so it gets the spoken hint instead).
                        if (onPickPhoto) fileRef.current?.click();
                        else call.askForPhoto();
                      }}
                      disabled={!talking}
                      aria-label="Search with a photo"
                      className={`${roundButton} bg-white/10 hover:bg-white/15`}
                    >
                      <Camera size={18} />
                    </button>
                    <span aria-hidden>ছবি</span>
                  </span>
                )}
                <span className={controlCell}>
                  <button type="button" onClick={() => call.hangUp()} aria-label="End call" className={`${roundButton} bg-[#f15c6d] hover:bg-[#e04b5c]`}>
                    <PhoneOff size={19} />
                  </button>
                  <span aria-hidden>কল কাটুন</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {!dragging && (
          <span className="mt-2 w-max whitespace-nowrap rounded-full bg-[#111b21]/85 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-white shadow" aria-hidden>
            {status}
          </span>
        )}
        {/* Phones don't listen while the assistant speaks (its voice came back as the shopper's words): cutting in is a tap. */}
        {!dragging && stopButton && (
          <button
            type="button"
            onClick={call.interrupt}
            className="mt-1.5 inline-flex w-max items-center gap-1 rounded-full bg-[#111b21] px-3 py-1.5 text-[12px] font-medium text-white shadow-lg"
          >
            <Mic size={13} />
            থামিয়ে বলি
          </button>
        )}
        {!dragging && checkout && talking && (
          <button
            type="button"
            onClick={checkout.onClick}
            disabled={checkout.busy}
            className="mt-1.5 inline-flex w-max items-center gap-1.5 rounded-full bg-[#25d366] px-3.5 py-2 text-[12.5px] font-semibold text-[#0b141a] shadow-lg disabled:opacity-60"
          >
            {checkout.busy ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
            অর্ডার করুন
          </button>
        )}
      </div>
      {/* Outside the card: the card closes on the tap, and the picker's answer must still arrive here. */}
      {onPickPhoto && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onPickPhoto(f);
          }}
        />
      )}
    </>
  );
}
