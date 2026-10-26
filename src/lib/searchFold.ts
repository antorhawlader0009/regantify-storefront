/*
 * Typo-tolerant, Bangla / Banglish / English product search for the storefront (IDEA-19), shared by every template.
 *
 * The first part (clean form, match form, Bangla to Roman) is a copy of server/src/marketplace/shop-text.ts (one type annotation added), the code the
 * Regantify Shop indexes with: change one, change the other, or a store's own search and the Shop disagree about the same word. The second
 * part (typo tolerance) is only here; it is what turns "punjabi", "pnjabi" or "পাঞ্জাবী" into the product named "পাঞ্জাবি".
 */

// U+200B-U+200D zero-width space / non-joiner / joiner, U+2060 word joiner, U+FEFF BOM, U+00AD soft hyphen, U+200E/U+200F and U+202A-U+202E
// direction marks.
const INVISIBLE = /[​-‍⁠﻿­‎‏‪-‮]/g;
const BANGLA_DIGIT = /[০-৯]/g;
// Khanda ta: one character (U+09CE) or ta + hasant (+ zero-width joiner, already removed). Both become the one character.
const KHANDA_TA_PAIR = /ত্(?![ক-হড়-য়])/g;

export function normalizeShopText(text: string): string {
  return text
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(KHANDA_TA_PAIR, 'ৎ')
    .replace(BANGLA_DIGIT, (d) => String(d.charCodeAt(0) - 0x09e6))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bangla letters that are spelt either way: each pair (or three) becomes the first letter's form. */
const BANGLA_FOLD: Array<[RegExp, string]> = [
  [/ী/g, 'ি'], // ী -> ি
  [/ূ/g, 'ু'], // ূ -> ু
  [/ঈ/g, 'ই'], // ঈ -> ই
  [/ঊ/g, 'উ'], // ঊ -> উ
  [/ণ/g, 'ন'], // ণ -> ন
  [/[ষস]/g, 'শ'], // ষ, স -> শ
  [/ঙ/g, 'ং'], // ঙ -> ং
  [/ঁ/g, ''], // ঁ dropped
];

/** Latin spellings that mean the same sound in Banglish (and harmlessly fold English words the same way on both sides). */
function foldLatin(text: string): string {
  return text
    .replace(/ph/g, 'f')
    .replace(/sh/g, 's')
    .replace(/([bcdgjkt])h/g, '$1')
    .replace(/z/g, 'j')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
}

/** The match form of a text (see the file header). */
export function foldShopText(text: string): string {
  let s = normalizeShopText(text);
  for (const [from, to] of BANGLA_FOLD) s = s.replace(from, to);
  return foldLatin(s);
}

// ---------------------------------------------------------------------------- Bangla to Roman

const CONSONANT: Record<string, string> = {
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
  'স': 's', 'হ': 'h',
};
/** A consonant followed by the nukta (NFC keeps ড় ঢ় য় as letter + nukta). */
const WITH_NUKTA: Record<string, string> = { 'ড': 'r', 'ঢ': 'rh', 'য': 'y' };
const VOWEL: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
  'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
};
const VOWEL_SIGN: Record<string, string> = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u',
  'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
};
const OTHER: Record<string, string> = { 'ং': 'ng', 'ঃ': 'h', 'ঁ': '', 'ৎ': 't', 'ৗ': '' };
const NUKTA = '়';
const HASANT = '্';
const YA = 'য';
const HAS_BANGLA = /[ঀ-৿]/;

/** One normalised Bangla word in Roman letters (other characters are kept as they are). Exported for tests. */
export function romanizeBanglaWord(word: string): string {
  const ch = [...word];
  /** Where the consonant at i ends (after its nukta, if any). */
  const end = (i: number) => (ch[i + 1] === NUKTA ? i + 2 : i + 1);
  const isConsonant = (c: string | undefined) => c !== undefined && c in CONSONANT;
  let out = '';
  let prevVowel = false; // the last sound written was a vowel (so this consonant is not the first of a word or of a cluster)
  for (let i = 0; i < ch.length; ) {
    const c = ch[i];
    if (isConsonant(c)) {
      const j = end(i);
      let sound = ch[i + 1] === NUKTA ? (WITH_NUKTA[c] ?? CONSONANT[c]) : CONSONANT[c];
      // Ya-phala (consonant + hasant + ya, ব্যাগ) is not a "j": it only colours the vowel.
      if (c === YA && ch[i + 1] !== NUKTA && ch[i - 1] === HASANT && isConsonant(ch[i - 2])) sound = '';
      const next = ch[j];
      if (next !== undefined && next in VOWEL_SIGN) {
        out += sound + VOWEL_SIGN[next];
        prevVowel = true;
        i = j + 1;
      } else if (next === HASANT) {
        out += sound;
        prevVowel = false;
        i = j + 1;
      } else {
        // The inherent vowel "o": not at the end of the word, and not when the next consonant carries its own vowel sign and this one
        // follows a vowel (বোরকা "borka", সরকার "sorkar", but কলম "kolom").
        const nextHasSign = isConsonant(next) && ch[end(j)] !== undefined && ch[end(j)] in VOWEL_SIGN;
        const inherent: string = next === undefined || (prevVowel && nextHasSign) ? '' : 'o';
        out += sound + inherent;
        prevVowel = inherent !== '';
        i = j;
      }
    } else if (c in VOWEL) {
      out += VOWEL[c];
      prevVowel = true;
      i += 1;
    } else if (c in VOWEL_SIGN) {
      out += VOWEL_SIGN[c];
      prevVowel = true;
      i += 1;
    } else if (c in OTHER) {
      out += OTHER[c];
      i += 1;
    } else if (c === NUKTA || c === HASANT) {
      i += 1;
    } else {
      out += c;
      prevVowel = false;
      i += 1;
    }
  }
  return out;
}

/** The Roman form of every Bangla word in a text (clean form, each word once, Latin-only words left out). */
export function banglishOf(text: string): string[] {
  const words = normalizeShopText(text).split(' ').filter((w) => HAS_BANGLA.test(w));
  return [...new Set(words.map(romanizeBanglaWord).filter((w) => /[a-z]/.test(w)))];
}

// ---------------------------------------------------------------------------- typo-tolerant matching

/*
 * How a typed search finds a product (IDEA-19). Both the typed words and the product's words are turned into the match form above, and a
 * Bangla word also gets its Roman form, so Bangla, Banglish and English meet: "পাঞ্জাবি", "panjabi" and "punjabi" are all one product.
 * What the fold cannot absorb is forgiven by a small edit distance, the way Algolia and Meilisearch do it (Damerau-Levenshtein: a letter
 * added, dropped, changed or two swapped), with the number of mistakes allowed growing with the word: none up to 3 letters, one from 4,
 * two from 8. Two choices for Banglish: a swap between two vowels (a/o/u/e/i), between letters people use for the same sound (v/b/w, c/k/s,
 * k/q, y/i), or leaving a vowel out costs half a mistake, because that is how Banglish is written ("punjabi", "pnjabi", "kolom"/"kalam").
 *
 * Results are the best tier only (a tier is a whole mistake): if some products match the words as typed, a product that needs a real typo fixed is not added to them
 * ("shirt" does not bring "skirt" when shirts exist). With no exact match, the closest spelling wins. Order: fewest mistakes first.
 */

const WORD_SPLIT = /[^\p{L}\p{M}\p{N}]+/u;
const LATIN_VOWEL = new Set(['a', 'e', 'i', 'o', 'u']);
const SAME_SOUND: string[] = ['vb', 'vw', 'ck', 'cs', 'kq', 'yi'];

function subCost(x: string, y: string): number {
  if (x === y) return 0;
  if (LATIN_VOWEL.has(x) && LATIN_VOWEL.has(y)) return 0.5;
  return SAME_SOUND.some((p) => (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x)) ? 0.5 : 1;
}
const gapCost = (x: string) => (LATIN_VOWEL.has(x) ? 0.5 : 1);

/** Mistakes between two words as letter lists (Damerau-Levenshtein with the half-cost rules above). Stops early above `max`. */
export function wordDistance(a: string[], b: string[], max: number): number {
  if (Math.abs(a.length - b.length) > max) return Infinity;
  const rows: number[][] = [[0]];
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = rows[0][j - 1] + gapCost(b[j - 1]);
  for (let i = 1; i <= a.length; i += 1) {
    rows[i] = [rows[i - 1][0] + gapCost(a[i - 1])];
    let best = rows[i][0];
    for (let j = 1; j <= b.length; j += 1) {
      let v = Math.min(rows[i - 1][j] + gapCost(a[i - 1]), rows[i][j - 1] + gapCost(b[j - 1]), rows[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1);
      rows[i][j] = v;
      if (v < best) best = v;
    }
    if (best > max) return Infinity;
  }
  return rows[a.length][b.length] <= max ? rows[a.length][b.length] : Infinity;
}

/** How many mistakes a typed word of this many letters may have. */
function budgetFor(letters: number): number {
  return letters >= 8 ? 2 : letters >= 4 ? 1 : 0;
}

/** Each word of a text in the match form; a Bangla word comes with its Roman form too (both are alternatives of one word). */
function wordForms(text: string): string[][] {
  const forms: string[][] = [];
  for (const w of normalizeShopText(text).split(WORD_SPLIT)) {
    if (!w) continue;
    const alts = [foldShopText(w)];
    if (HAS_BANGLA.test(w)) {
      const roman = foldShopText(romanizeBanglaWord(w));
      if (/[a-z]/.test(roman) && roman !== alts[0]) alts.push(roman);
    }
    forms.push(alts);
  }
  return forms;
}

interface Prepared {
  /** Every word in every form. */
  tokens: string[];
  /** The words run together, once as written and once with Bangla words in Roman: "t-shirt" and "tshirt" meet here. */
  compacts: string[];
}

function prepare(text: string): Prepared {
  const forms = wordForms(text);
  const tokens = forms.flat();
  const compacts = [forms.map((f) => f[0]).join(''), forms.map((f) => f[f.length - 1]).join('')];
  return { tokens, compacts: [...new Set(compacts)] };
}

/** Mistakes between a typed word and one word of a product: 0 when it is inside it, else the closest, else Infinity. */
function tokenCost(typed: string, word: string): number {
  if (word.includes(typed)) return 0;
  const a = [...typed];
  const max = budgetFor(a.length);
  if (max === 0) return Infinity;
  const b = [...word];
  let best = wordDistance(a, b, max);
  // Still being typed: the start of the word counts, so "punjab" finds "panjabi".
  for (const p of [a.length - 1, a.length, a.length + 1]) {
    if (p >= 3 && p < b.length) best = Math.min(best, wordDistance(a, b.slice(0, p), max));
  }
  return best;
}

export interface SearchableProduct {
  name: string;
  searchKeywords?: string[] | null;
  category?: string | null;
  brand?: string | null;
}

const preparedCache = new WeakMap<object, Prepared>();
function preparedOf(p: SearchableProduct): Prepared {
  let got = preparedCache.get(p);
  if (!got) {
    got = prepare([p.name, ...(p.searchKeywords ?? []), p.category ?? '', p.brand ?? ''].join(' '));
    preparedCache.set(p, got);
  }
  return got;
}

interface PreparedQuery {
  words: string[][];
  compacts: string[];
}

function prepareQuery(query: string): PreparedQuery | null {
  const words = wordForms(query);
  if (words.length === 0) return null;
  const compacts = [words.map((f) => f[0]).join(''), words.map((f) => f[f.length - 1]).join('')];
  return { words, compacts: [...new Set(compacts)] };
}

/** Mistakes needed for a product to answer the query (0 = as typed), or null when it does not. Every typed word must be found. */
function costOf(p: SearchableProduct, q: PreparedQuery, seen: Map<string, number>): number | null {
  const h = preparedOf(p);
  if (q.compacts.some((c) => c.length >= 2 && h.compacts.some((hc) => hc.includes(c)))) return 0;
  let total = 0;
  for (const alts of q.words) {
    let best = Infinity;
    for (const typed of alts) {
      for (const word of h.tokens) {
        // The same typed word meets the same product word again and again (every "cotton" in the catalog): worked out once per search.
        const key = typed + '|' + word;
        let c = seen.get(key);
        if (c === undefined) {
          c = tokenCost(typed, word);
          seen.set(key, c);
        }
        if (c < best) best = c;
        if (best === 0) break;
      }
      if (best === 0) break;
    }
    if (best === Infinity) return null;
    total += best;
  }
  return total;
}

/**
 * The products that answer a search, best first (see the block comment above). An empty query returns everything in its own order.
 * Cheap enough to run on every keystroke over a few thousand products: each product is prepared once (cached on the object), and a
 * word pair is compared only when its length allows the mistakes.
 */
export function searchProducts<T extends SearchableProduct>(items: readonly T[], query: string): T[] {
  const q = prepareQuery(query);
  if (!q) return [...items];
  const scored: { item: T; cost: number; at: number }[] = [];
  const seen = new Map<string, number>();
  items.forEach((item, at) => {
    const cost = costOf(item, q, seen);
    if (cost !== null) scored.push({ item, cost, at });
  });
  if (scored.length === 0) return [];
  // Tiers are whole mistakes: as typed and a vowel spelled differently (0 and 0.5) are one tier, a real typo (1) is the next.
  const tier = Math.floor(Math.min(...scored.map((s) => s.cost)));
  return scored
    .filter((s) => Math.floor(s.cost) === tier)
    .sort((x, y) => x.cost - y.cost || x.at - y.at)
    .map((s) => s.item);
}
