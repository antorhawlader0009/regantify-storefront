/**
 * Phone-call sounds for the voice call, made with WebAudio (nothing to download, and nobody's recording copied).
 * The outgoing ring is modelled on a messaging app's call ringback: a soft, low, rounded tone of about 1.5 s every
 * 4 s, with a gentle start and fade so it never clicks. If the store's voice folder has a `ring.mp3`, that plays instead.
 */

type Stop = () => void;

function tone(ctx: AudioContext, out: AudioNode, at: number, freq: number, dur: number, peak: number, attack = 0.04, release = 0.25) {
  const osc = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const g = ctx.createGain();
  const hg = ctx.createGain();
  osc.type = 'sine';
  harmonic.type = 'sine';
  osc.frequency.value = freq;
  harmonic.frequency.value = freq * 2;
  hg.gain.value = 0.18; // a little warmth, not a buzz
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + dur - release);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g);
  harmonic.connect(hg).connect(g);
  g.connect(out);
  osc.start(at);
  harmonic.start(at);
  osc.stop(at + dur + 0.05);
  harmonic.stop(at + dur + 0.05);
}

/** A low-pass "phone line" so the tones sound like they come through a call, not a synth. */
function line(ctx: AudioContext): AudioNode {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  lp.connect(master).connect(ctx.destination);
  return lp;
}

/** Starts the outgoing ring; returns a function that stops it at once. */
export function startRingback(ctx: AudioContext, ringUrl?: string | null): Stop {
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  const synth = () => {
    if (stopped) return;
    const out = line(ctx);
    const ring = () => {
      const t = ctx.currentTime + 0.05;
      // Two notes blended into one rounded "tuuu": the second a little higher, starting just after the first.
      tone(ctx, out, t, 440, 1.5, 0.11, 0.06, 0.35);
      tone(ctx, out, t + 0.02, 480, 1.48, 0.07, 0.06, 0.35);
    };
    ring();
    timer = setInterval(ring, 4000);
  };

  if (ringUrl) {
    audio = new Audio(ringUrl);
    audio.loop = true;
    audio.volume = 0.7;
    audio.play().catch(() => {
      audio = null;
      synth();
    });
  } else synth();

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    audio?.pause();
  };
}

/** The short blip when the call is picked up. */
export function playConnect(ctx: AudioContext) {
  const out = line(ctx);
  const t = ctx.currentTime + 0.02;
  tone(ctx, out, t, 660, 0.12, 0.08, 0.01, 0.06);
  tone(ctx, out, t + 0.13, 880, 0.16, 0.08, 0.01, 0.08);
}

/** The falling "call ended" tone. */
export function playHangup(ctx: AudioContext) {
  const out = line(ctx);
  const t = ctx.currentTime + 0.02;
  tone(ctx, out, t, 620, 0.16, 0.09, 0.01, 0.08);
  tone(ctx, out, t + 0.18, 480, 0.16, 0.09, 0.01, 0.08);
  tone(ctx, out, t + 0.36, 360, 0.28, 0.09, 0.01, 0.15);
}
