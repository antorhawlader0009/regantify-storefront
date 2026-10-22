/**
 * Requests the voice call handles itself, without asking the AI (instant and free):
 *   - photo search: "ছবি দিয়ে খুঁজতে চাই", "ami photo search korte chai" -> the camera opens;
 *   - hang up: "কল রেখে দাও", "কলটা কাটো", "call kete dao", "বাই", "খোদা হাফেজ" -> goodbye, then the call ends;
 *   - open a product: "পণ্যটা খুলে দেখাও", "২ নম্বরটা ওপেন করো", "কফি মগটা খুলুন" -> its page opens in this tab.
 * "Show me its photos" (ছবি দেখান) or "show me more" (আরো দেখাও) are questions and still go to the AI, and
 * "put it in the cart" (কার্টে রেখে দেন) is not a hang-up: hanging up needs the word call/phone or a goodbye.
 */
import { speakableBangla, speechWords } from './banglaSpeech';

const PHOTO = /(ছবি|ফটো|পিক|ক্যামেরা|photo|pic|picture|image|camera)/iu;
const SEARCH = /(খুঁজ|খোঁজ|সার্চ|পাঠা|তুল|দিয়ে|দিয়ে|দিব|দেব|দিচ্ছি|মিলি|search|send|match|scan)/iu;

export function wantsPhotoSearch(text: string): boolean {
  const t = text.normalize('NFC');
  return PHOTO.test(t) && SEARCH.test(t);
}

const HANG_UP = [
  /(কল|ফোন|লাইন)\S{0,3}\s*(রাখ|রেখে|কাট|কেটে|কাটো|শেষ|বন্ধ|ছাড়)/u,
  /(call|phone|line)\s*(ta|te|ti)?\s*(rakh|rekhe|kat|kete|cut|end|off|band|bondho|sesh|shesh)/i,
  /\b(hang\s*up|end\s+the\s+call|bye|bye\s*bye|goodbye)\b/i,
  /(বাই|টাটা|আল্লাহ\s*হাফেজ|খোদা\s*হাফেজ|আল্লাহ\s*হাফিজ)[\s।!.]*$/u,
];

export function wantsHangUp(text: string): boolean {
  const t = text.normalize('NFC').trim();
  return HANG_UP.some((r) => r.test(t));
}

// The cart: "কার্ট দেখাও", "cart dekhao", "আমার কার্টে কী আছে দেখাও" open the slide-in cart; "কার্ট বন্ধ করো", "cart close koro"
// close it. "কার্টে রাখো / যোগ করো" (put it in the cart) is neither: opening needs দেখা/খোল/ওপেন, closing বন্ধ/ক্লোজ.
const CART = /(কার্ট|কার্টে|cart|ব্যাগ)/iu;
const CART_SHOW = /(দেখা|দেখি|খুল|খোল|ওপেন|open|show|dekha|dekhao|khulo|kholo)/iu;
const CART_CLOSE = /(বন্ধ|ক্লোজ|close|band|bondho|lukao|লুকা|সরা|hide)/iu;

export function wantsCloseCart(text: string, cartOpen: boolean): boolean {
  const t = text.normalize('NFC');
  // While the cart is open, a plain "বন্ধ করো" / "close" is enough.
  return CART_CLOSE.test(t) && (CART.test(t) || cartOpen) && !/(কল|ফোন|call|phone)/iu.test(t);
}

export function wantsShowCart(text: string): boolean {
  const t = text.normalize('NFC');
  return CART.test(t) && CART_SHOW.test(t) && !CART_CLOSE.test(t);
}

const OPEN = /(খুল|খোল|ওপেন|open|পেজ|পেইজ|page|ডিটেইল|details?|বিস্তারিত)/iu;

export function wantsOpen(text: string): boolean {
  return OPEN.test(text.normalize('NFC'));
}

const ORDINALS: [RegExp, number][] = [
  [/(^|\s)(১|1|এক|প্রথম|first|ফার্স্ট)(\s|নম্বর|নাম্বার|টা|টি|$)/iu, 0],
  [/(^|\s)(২|2|দুই|দ্বিতীয়|second|সেকেন্ড)(\s|নম্বর|নাম্বার|টা|টি|$)/iu, 1],
  [/(^|\s)(৩|3|তিন|তৃতীয়|third|থার্ড)(\s|নম্বর|নাম্বার|টা|টি|$)/iu, 2],
  [/(^|\s)(৪|4|চার|চতুর্থ|fourth)(\s|নম্বর|নাম্বার|টা|টি|$)/iu, 3],
  [/(^|\s)(৫|5|পাঁচ|পঞ্চম|fifth)(\s|নম্বর|নাম্বার|টা|টি|$)/iu, 4],
];

/**
 * Which of the products on the call screen the shopper means: by number ("২ নম্বরটা"), by name as people say it
 * (the name is turned into Bangla letters the way the voice reads it: "Ceramic Coffee Mug" -> সেরামিক কফি মগ), or the only
 * one shown. -1 when it can't tell (the AI is asked then).
 */
export function pickProduct(text: string, names: string[]): number {
  if (!names.length) return -1;
  const t = text.normalize('NFC');
  for (const [re, i] of ORDINALS) if (i < names.length && re.test(t)) return i;
  // "মগটা", "ওয়ালেটের", "পাঞ্জাবিগুলো": the word without its Bangla ending.
  const heard = new Set(speechWords(t).map((w) => w.replace(/(গুলো|গুলি|টার|টির|টা|টি|খানা|ের|এর|র|কে)$/u, '') || w));
  let best = -1;
  let bestScore = 0;
  names.forEach((name, i) => {
    const words = new Set([...speechWords(name), ...speechWords(speakableBangla(name))]);
    let score = 0;
    for (const w of words) if (w.length >= 2 && [...heard].some((h) => h === w || h.startsWith(w) || (h.length >= 3 && w.startsWith(h)))) score++;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  if (best >= 0) return best;
  return names.length === 1 ? 0 : -1;
}

// "back jao", "পেছনে যাও", "আগের পেজে যাও": one page back (the browser's own Back).
const BACK = [
  /(পেছনে|পিছনে|পেছন|পিছন|ব্যাক|আগের\s*(পেজ|পেইজ|পাতা))\S{0,2}\s*(যাও|যান|যাই|চলো|চলেন|যেতে|নিয়ে|ফিরে|ফেরত)/u,
  /\b(go\s*back|back\s*(jao|jan|jai|chalo|koro|go))\b/i,
];

export function wantsBack(text: string): boolean {
  const t = text.normalize('NFC');
  return BACK.some((r) => r.test(t));
}
