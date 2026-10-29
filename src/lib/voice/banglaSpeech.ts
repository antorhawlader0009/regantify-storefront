/**
 * Text -> something the Piper Bangla voice can read aloud. The voice (bn_BD speaker 8) reads ONLY Bangla letters:
 * digits, ৳, English words, links and symbols come out as noise or silence. The server already asks the AI to answer in
 * Bangla letters on a call (chat-order.ts VOICE_CALL_NOTE); this is the safety net for what still slips through:
 *
 *   numbers     ৳1,250 -> এক হাজার দুইশো পঞ্চাশ টাকা, 2টি -> দুইটি, 12.5 -> বারো দশমিক পাঁচ, 50% -> পঞ্চাশ শতাংশ
 *   phones      01712345678 -> শূন্য এক সাত এক দুই ... (digit by digit)
 *   English     a word list first (size -> সাইজ), short capitals spelled (XL -> এক্সএল), anything else by sound rules
 *   symbols     links, emojis, markdown and brackets are dropped; "/" and "&" become words
 *
 * The result holds only Bangla letters, spaces and the punctuation the voice pauses on (। , ? !).
 */

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

// 0..99 in Bangla words (irregular, so a table).
const UNDER_100 = (
  'শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ ' +
  'একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আটাশ ঊনত্রিশ ত্রিশ একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ ঊনচল্লিশ চল্লিশ ' +
  'একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ ঊনপঞ্চাশ পঞ্চাশ একান্ন বাহান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন ঊনষাট ষাট ' +
  'একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি ঊনসত্তর সত্তর একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর ঊনআশি আশি ' +
  'একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি অষ্টাশি ঊননব্বই নব্বই একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই'
).split(' ');

/** A whole number in Bangla words, Indian grouping (হাজার, লাখ, কোটি). */
export function numberToBangla(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  n = Math.floor(n);
  if (n < 100) return UNDER_100[n];
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  if (crore) parts.push(`${numberToBangla(crore)} কোটি`);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  if (lakh) parts.push(`${UNDER_100[lakh]} লাখ`);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  if (thousand) parts.push(`${UNDER_100[thousand]} হাজার`);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  if (hundred) parts.push(`${hundred === 2 ? 'দুই' : UNDER_100[hundred]}শো`);
  n %= 100;
  if (n) parts.push(UNDER_100[n]);
  return parts.join(' ');
}

const digitByDigit = (s: string) => s.replace(/\D/g, '').split('').map((d) => UNDER_100[Number(d)]).join(' ');

/** "1,250" / "12.5" -> words. Long runs that aren't amounts (codes, ids) are read digit by digit. */
function amountToBangla(raw: string): string {
  const [whole, frac] = raw.replace(/,/g, '').split('.');
  if (whole.length > 9) return digitByDigit(whole);
  const words = numberToBangla(Number(whole));
  return frac ? `${words} দশমিক ${digitByDigit(frac)}` : words;
}

// Common English words in a Bangladeshi shop, as people say them.
const WORDS: Record<string, string> = {
  order: 'অর্ডার', orders: 'অর্ডার', delivery: 'ডেলিভারি', cash: 'ক্যাশ', on: 'অন', size: 'সাইজ', sizes: 'সাইজ', color: 'কালার', colour: 'কালার',
  black: 'ব্ল্যাক', white: 'হোয়াইট', red: 'রেড', blue: 'ব্লু', green: 'গ্রিন', yellow: 'ইয়েলো', pink: 'পিংক', grey: 'গ্রে', gray: 'গ্রে',
  brown: 'ব্রাউন', navy: 'নেভি', maroon: 'মেরুন', purple: 'পার্পল', orange: 'অরেঞ্জ', golden: 'গোল্ডেন', silver: 'সিলভার', olive: 'অলিভ',
  cotton: 'কটন', shirt: 'শার্ট', tshirt: 'টি শার্ট', panjabi: 'পাঞ্জাবি', punjabi: 'পাঞ্জাবি', pant: 'প্যান্ট', pants: 'প্যান্ট', jeans: 'জিন্স',
  shoe: 'শু', shoes: 'শুজ', sneakers: 'স্নিকার্স', sandal: 'স্যান্ডেল', bag: 'ব্যাগ', watch: 'ওয়াচ', phone: 'ফোন', mobile: 'মোবাইল', cover: 'কভার',
  case: 'কেস', small: 'স্মল', medium: 'মিডিয়াম', large: 'লার্জ', free: 'ফ্রি', offer: 'অফার', discount: 'ডিসকাউন্ট', price: 'প্রাইস',
  stock: 'স্টক', product: 'প্রোডাক্ট', products: 'প্রোডাক্ট', cart: 'কার্ট', checkout: 'চেকআউট', online: 'অনলাইন', payment: 'পেমেন্ট',
  bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', coupon: 'কুপন', code: 'কোড', gift: 'গিফট', pack: 'প্যাক', combo: 'কম্বো', premium: 'প্রিমিয়াম',
  new: 'নিউ', sale: 'সেল', hoodie: 'হুডি', jacket: 'জ্যাকেট', saree: 'শাড়ি', sari: 'শাড়ি', kurti: 'কুর্তি', kurta: 'কুর্তা', piece: 'পিস',
  three: 'থ্রি', two: 'টু', one: 'ওয়ান', kg: 'কেজি', gm: 'গ্রাম', g: 'গ্রাম', ml: 'এমএল', inch: 'ইঞ্চি', cm: 'সেন্টিমিটার', polo: 'পোলো',
  denim: 'ডেনিম', leather: 'লেদার', silk: 'সিল্ক', linen: 'লিনেন', wallet: 'ওয়ালেট', belt: 'বেল্ট', cap: 'ক্যাপ', ok: 'ওকে', okay: 'ওকে',
  thanks: 'থ্যাংকস', thank: 'থ্যাংক', you: 'ইউ', sir: 'স্যার', the: 'দ্য', and: 'অ্যান্ড', for: 'ফর', with: 'উইথ', of: 'অফ', in: 'ইন',
  pro: 'প্রো', max: 'ম্যাক্স', plus: 'প্লাস', mini: 'মিনি', ultra: 'আলট্রা', smart: 'স্মার্ট', home: 'হোম', store: 'স্টোর', shop: 'শপ',
  fashion: 'ফ্যাশন', collection: 'কালেকশন', style: 'স্টাইল', regular: 'রেগুলার', slim: 'স্লিম', fit: 'ফিট', half: 'হাফ', full: 'ফুল',
  sleeve: 'স্লিভ', men: 'মেন', mens: 'মেন্স', women: 'উইমেন', womens: 'উইমেন্স', kids: 'কিডস', baby: 'বেবি', girls: 'গার্লস', boys: 'বয়েজ',
  summer: 'সামার', winter: 'উইন্টার', edition: 'এডিশন', original: 'অরিজিনাল', quality: 'কোয়ালিটি', tk: 'টাকা', taka: 'টাকা', bdt: 'টাকা',
  coffee: 'কফি', mug: 'মগ', ceramic: 'সেরামিক', cup: 'কাপ', glass: 'গ্লাস', bottle: 'বোতল', running: 'রানিং', printed: 'প্রিন্টেড',
  ladies: 'লেডিস', best: 'বেস্ট', set: 'সেট', jersey: 'জার্সি', oversized: 'ওভারসাইজড', cricket: 'ক্রিকেট', bat: 'ব্যাট',
  charge: 'চার্জ', call: 'কল', samsung: 'স্যামসাং', galaxy: 'গ্যালাক্সি', iphone: 'আইফোন', apple: 'অ্যাপল', xiaomi: 'শাওমি',
  dhaka: 'ঢাকা', chittagong: 'চট্টগ্রাম', sylhet: 'সিলেট', size_guide: 'সাইজ গাইড', guide: 'গাইড', item: 'আইটেম', items: 'আইটেম',
  hello: 'হ্যালো', hi: 'হাই', yes: 'ইয়েস', no: 'নো', please: 'প্লিজ', sorry: 'সরি', express: 'এক্সপ্রেস', pickup: 'পিকআপ',
  serum: 'সিরাম', cream: 'ক্রিম', oil: 'অয়েল', lotion: 'লোশন', face: 'ফেস', wash: 'ওয়াশ', hair: 'হেয়ার', body: 'বডি', perfume: 'পারফিউম',
  jan: 'জানুয়ারি', feb: 'ফেব্রুয়ারি', mar: 'মার্চ', apr: 'এপ্রিল', may: 'মে', jun: 'জুন', jul: 'জুলাই', aug: 'আগস্ট', sep: 'সেপ্টেম্বর',
  sept: 'সেপ্টেম্বর', oct: 'অক্টোবর', nov: 'নভেম্বর', dec: 'ডিসেম্বর',
};

// Letters as people say them, for short capitals (XL, COD, SKU).
const LETTERS: Record<string, string> = {
  a: 'এ', b: 'বি', c: 'সি', d: 'ডি', e: 'ই', f: 'এফ', g: 'জি', h: 'এইচ', i: 'আই', j: 'জে', k: 'কে', l: 'এল', m: 'এম',
  n: 'এন', o: 'ও', p: 'পি', q: 'কিউ', r: 'আর', s: 'এস', t: 'টি', u: 'ইউ', v: 'ভি', w: 'ডাবলিউ', x: 'এক্স', y: 'ওয়াই', z: 'জেড',
};

// Sound rules for an English word nobody listed: consonant groups first (longest match), vowels as Bangla vowel signs.
const CONSONANTS: [string, string][] = [
  ['tch', 'চ'], ['sh', 'শ'], ['ch', 'চ'], ['th', 'থ'], ['ph', 'ফ'], ['kh', 'খ'], ['gh', 'ঘ'], ['ck', 'ক'], ['qu', 'কো'],
  ['b', 'ব'], ['c', 'ক'], ['d', 'ড'], ['f', 'ফ'], ['g', 'গ'], ['h', 'হ'], ['j', 'জ'], ['k', 'ক'], ['l', 'ল'], ['m', 'ম'], ['n', 'ন'],
  ['p', 'প'], ['q', 'ক'], ['r', 'র'], ['s', 'স'], ['t', 'ট'], ['v', 'ভ'], ['w', 'ও'], ['x', 'ক্স'], ['z', 'জ'],
];
const VOWELS: [string, string, string][] = [
  // [letters, after a consonant, on its own]
  ['ee', 'ী', 'ঈ'], ['ea', 'ি', 'ই'], ['oo', 'ু', 'উ'], ['ou', 'াউ', 'আউ'], ['ow', 'াও', 'আও'], ['oa', 'ো', 'ও'],
  ['ai', 'েই', 'এই'], ['ay', 'েই', 'এই'], ['ey', 'ে', 'এ'],
  ['a', 'া', 'আ'], ['e', 'ে', 'এ'], ['i', 'ি', 'ই'], ['o', 'ো', 'ও'], ['u', 'ু', 'উ'], ['y', 'ি', 'ই'],
];

function soundOut(word: string): string {
  let w = word.toLowerCase().replace(/(.)\1+/g, '$1');
  if (w.length > 3 && /[^aeiou]e$/.test(w)) w = w.slice(0, -1); // silent final e: "cable" -> cabl
  let out = '';
  let prevConsonant = false;
  for (let i = 0; i < w.length; ) {
    const v = VOWELS.find(([k]) => w.startsWith(k, i) && !(k === 'y' && i === 0));
    if (v) {
      out += prevConsonant ? v[1] : v[2];
      prevConsonant = false;
      i += v[0].length;
      continue;
    }
    // "c" before e/i/y sounds like s; "y" starting a word is a consonant (ইয়).
    let c = CONSONANTS.find(([k]) => w.startsWith(k, i));
    if (w[i] === 'c' && /[eiy]/.test(w[i + 1] ?? '')) c = ['c', 'স'];
    if (w[i] === 'y') c = ['y', 'ইয়'];
    if (!c) {
      i++;
      continue;
    }
    if (prevConsonant && c[1] !== 'ইয়') out += '্';
    out += c[1];
    prevConsonant = c[1] !== 'ইয়' && c[1] !== 'কো';
    i += c[0].length;
  }
  return out;
}

function englishWord(word: string): string {
  const lower = word.toLowerCase();
  if (WORDS[lower]) return WORDS[lower];
  // Short capitals are letters: XL, COD, SKU (but a known word like "OK" was caught above).
  if (/^[A-Z]{1,4}$/.test(word)) return word.toLowerCase().split('').map((l) => LETTERS[l]).join('');
  // A lone lower-case letter (a size like "m" or "s") is also a letter.
  if (word.length === 1) return LETTERS[lower] ?? '';
  // Joined words: CamelCase and t-shirt style are read part by part.
  const parts = word.split(/(?<=[a-z])(?=[A-Z])/);
  if (parts.length > 1) return parts.map(englishWord).join(' ');
  return soundOut(word);
}

const toAsciiDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Turns a reply into text the Bangla voice can read (see the file header). */
export function speakableBangla(input: string): string {
  let t = toAsciiDigits(input.normalize('NFC'));
  t = t
    .replace(/https?:\/\/\S+|www\.\S+/gi, ' লিংক ')
    .replace(/\S+@\S+\.\S+/g, ' ইমেইল ')
    .replace(/\p{Extended_Pictographic}|️|‍(?![ঀ-৿])/gu, ' ')
    .replace(/[*_#`~>|"“”‘’]/g, ' ')
    .replace(/[()[\]{}]/g, ', ')
    .replace(/\.{2,}|…/g, '। ')
    .replace(/\n+/g, '। ');

  // Phone numbers, digit by digit (before amounts eat them).
  t = t.replace(/(?:\+?88)?01\d{9}\b/g, (m) => ` ${digitByDigit(m)} `);
  // Times (4:30 -> চারটা ত্রিশ).
  t = t.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => ` ${numberToBangla(Number(h))}টা${m === '00' ? '' : ` ${numberToBangla(Number(m))}`} `);
  // Money: ৳1,250 / 1250৳ / 1250 tk / Tk 1250.
  // Digits with Bangladeshi or Western grouping (1,250 / 1,25,000), never a comma that only ends a clause.
  const AMOUNT = '(\\d+(?:,\\d{2,3})*(?:\\.\\d+)?)';
  t = t
    .replace(new RegExp(`(?:৳|\\b(?:tk|bdt|taka)\\.?)\\s*${AMOUNT}`, 'gi'), (_, a) => ` ${amountToBangla(a)} টাকা `)
    .replace(new RegExp(`${AMOUNT}\\s*(?:৳|(?:tk|bdt|taka)\\b)`, 'gi'), (_, a) => ` ${amountToBangla(a)} টাকা `)
    .replace(/৳/g, ' টাকা ');
  // Percent and ranges.
  t = t.replace(new RegExp(`${AMOUNT}\\s*%`, 'g'), (_, a) => ` ${amountToBangla(a)} শতাংশ `);
  t = t.replace(/(\d+)\s*[-–]\s*(\d+)/g, (_, a, b) => `${a} থেকে ${b}`);
  // Any other number; a Bangla suffix stays attached (2টি -> দুইটি).
  t = t.replace(new RegExp(AMOUNT, 'g'), (m) => ` ${amountToBangla(m)}`);

  // Symbols that mean words.
  t = t.replace(/\s*&\s*/g, ' এবং ').replace(/\s*\+\s*/g, ' প্লাস ').replace(/\s*\/\s*/g, ', ').replace(/\s*[:;]\s*/g, ', ');
  t = t.replace(/(?<=[A-Za-z])[-'](?=[A-Za-z])/g, ' ').replace(/\s[-–\u2014]\s/g, ', ');

  // English words.
  t = t.replace(/[A-Za-z]+/g, (w) => ` ${englishWord(w)} `);

  // English full stops become the Bangla dari; keep only Bangla letters and the pauses.
  t = t.replace(/\./g, '।').replace(/[^ঀ-৿‌‍\s।,?!]/g, ' ');
  return t
    .replace(/\s+([।,?!])/g, '$1')
    .replace(/([।,?!])(?=[^\s।,?!])/g, '$1 ')
    .replace(/([।?!])[।,]+/g, '$1')
    .replace(/^[\s।,]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Splits speakable text into the pieces spoken one after another: sentences, a long one at its commas, and the first
 * piece kept short so the voice starts quickly while the next piece is still being made.
 */
export function speechChunks(text: string): string[] {
  const sentences = text.split(/(?<=[।?!])\s+/u).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= 90) {
      out.push(s);
      continue;
    }
    let cur = '';
    for (const part of s.split(/(?<=,)\s+/u)) {
      if (cur && (cur + ' ' + part).length > 90) {
        out.push(cur);
        cur = part;
      } else cur = cur ? `${cur} ${part}` : part;
    }
    if (cur) out.push(cur);
  }
  const first = out[0];
  if (first && first.length > 50) {
    const cut = first.indexOf(',', 15);
    if (cut > 0 && cut < first.length - 10) out.splice(0, 1, first.slice(0, cut + 1), first.slice(cut + 1).trim());
  }
  return out;
}

/** For telling the shopper's own speech from the assistant's voice heard back through the speaker. */
export function speechWords(text: string): string[] {
  return toAsciiDigits(text.normalize('NFC'))
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\d\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}
