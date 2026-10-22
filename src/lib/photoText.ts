import type { Worker } from 'tesseract.js';

/**
 * Reads the text in a photo the shopper sends to the store's AI chat, in the browser (Tesseract.js, Bangla + English),
 * when Super Admin left Admin > AI Settings > "Text in chat photos" on Browser (the server's photo-match/photo-text.ts
 * has the rules). The library and its files (about 7 MB: engine, English and Bangla data, from jsDelivr pinned to the
 * installed version) load only when a photo is sent, and the browser keeps them for later visits. Never throws: any
 * failure is "no text", and the chat still works with the picture match.
 *
 * Only the words Tesseract is fairly sure of are kept; the server cleans the text again and cuts it short.
 */

const READ_SIDE = 1600;
const WORD_MIN_CONFIDENCE = 55;
const MAX_CHARS = 1500;
/** The worker is stopped after this long without a photo, to give the memory back. */
const IDLE_STOP_MS = 2 * 60_000;

let worker: Promise<Worker> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = import('tesseract.js').then(({ createWorker }) => createWorker(['ben', 'eng'], 1 /* LSTM only */));
    worker.catch(() => {
      worker = null;
    });
  }
  return worker;
}

function stopWorker() {
  const w = worker;
  worker = null;
  void w?.then((x) => x.terminate()).catch(() => undefined);
}

/** Grey and at most READ_SIDE px on the long edge, which Tesseract reads best and fastest. */
async function prepare(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, READ_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.filter = 'grayscale(1)';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();
  return canvas;
}

export async function readPhotoText(file: File): Promise<string | null> {
  if (idleTimer) clearTimeout(idleTimer);
  try {
    const [w, canvas] = await Promise.all([getWorker(), prepare(file)]);
    const { data } = await w.recognize(canvas, {}, { blocks: true, text: false });
    const lines: string[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs) {
        for (const line of para.lines) {
          const words = line.words.filter((x) => x.confidence >= WORD_MIN_CONFIDENCE).map((x) => x.text.trim()).filter(Boolean);
          if (words.length) lines.push(words.join(' '));
        }
      }
    }
    const text = lines.join('\n').trim();
    return text ? text.slice(0, MAX_CHARS) : null;
  } catch {
    stopWorker();
    return null;
  } finally {
    idleTimer = setTimeout(stopWorker, IDLE_STOP_MS);
  }
}
