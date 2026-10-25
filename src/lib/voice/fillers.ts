/**
 * What the assistant says on the call while the answer is still coming (the user's rule, 2026-10-25: not a bare "একটু
 * দেখছি", but a natural line about what the shopper asked, so the wait doesn't feel long).
 *
 * - The first line is picked by the topic of what the shopper said (topicOf): price, delivery, stock, an order they
 *   placed, ordering, a problem, offers, looking for something, or anything else.
 * - When the AI looks something up (the server streams which tool runs), a line about that lookup is said.
 * - If the answer is still not there after that, a short "almost ready" line, at most once more.
 * The same line is never said twice in a row (pickLine), and every line is Bangla letters only (spoken by the Bangla
 * voice), five to twelve words, so it ends quickly once the answer is ready.
 */

export type FillerTopic = 'complaint' | 'order_status' | 'delivery' | 'offer' | 'price' | 'stock' | 'order' | 'search' | 'general';

const TOPIC_RULES: Array<[FillerTopic, RegExp]> = [
  ['complaint', /নষ্ট|ভাঙা|ভাঙ্গা|ছেঁড়া|ছেড়া|ভুল|ফেরত|রিটার্ন|রিফান্ড|সমস্যা|অভিযোগ|নালিশ|damage|broken|\bvul\b|\bbhul\b|wrong|return|refund|problem|somossa|complain/i],
  ['order_status', /অর্ডার\S*\s*(কই|কোথায়|কবে|কখন|এসেছে|আসবে|অবস্থা|স্ট্যাটাস)|পার্সেল|ট্র্যাক|order\S*\s*(koi|kothay|kobe|status)|parcel|track/i],
  ['delivery', /ডেলিভারি|ডেলিভারী|পৌঁছা|কুরিয়ার|শিপিং|চার্জ|কবে পাব|delivery|courier|shipping|charge|kobe pabo/i],
  ['offer', /অফার|ডিসকাউন্ট|ছাড়|কুপন|সেল|offer|discount|coupon|\bsale\b/i],
  ['price', /দাম|কত টাকা|কতো টাকা|রেট|price|\bdam\b|koto taka|\brate\b/i],
  ['stock', /স্টক|সাইজ|রং|রঙ|কালার|পাওয়া যাবে|পাওয়া যায়|stock|size|colou?r|available|paowa/i],
  ['order', /নিব|নেব|নিতে চাই|কিনব|কিনতে|অর্ডার|buy|order|nibo|nebo|kinbo|kinte/i],
  ['search', /খুঁজ|খুজ|দেখান|দেখাও|চাই|লাগবে|আছে|khuj|dekhan|dekhao|\bchai\b|lagbe|ache/i],
];

/** What the shopper's words are about, for the first line. */
export function topicOf(text: string): FillerTopic {
  for (const [topic, re] of TOPIC_RULES) if (re.test(text)) return topic;
  return 'general';
}

const FIRST_LINES: Record<FillerTopic, string[]> = {
  complaint: [
    'জি, আপনার সমস্যাটা বুঝতে পেরেছি, গুরুত্ব দিয়ে দেখছি।',
    'দুঃখিত যে এমন হয়েছে, বিষয়টা এখনই নোট করে নিচ্ছি।',
    'আচ্ছা, ব্যাপারটা খুলে দেখছি, যাতে ঠিক সমাধানটা দিতে পারি।',
  ],
  order_status: [
    'জি, আপনার অর্ডারটা এখন কোথায় আছে, খোঁজ নিচ্ছি।',
    'আচ্ছা, অর্ডারের সর্বশেষ অবস্থাটা মিলিয়ে বলছি।',
    'ঠিক আছে, পার্সেলের খবরটা এখনই বের করছি।',
  ],
  delivery: [
    'জি, আপনার এলাকায় ডেলিভারি খরচ আর সময়টা হিসাব করছি।',
    'আচ্ছা, কবে পৌঁছাবে আর খরচ কত, সেটা মিলিয়ে নিচ্ছি।',
    'অবশ্যই, ডেলিভারির খুঁটিনাটি এখনই জানিয়ে দিচ্ছি।',
  ],
  offer: [
    'জি, এখন কোন কোন অফার চলছে, সেটা মিলিয়ে নিচ্ছি।',
    'আচ্ছা, আপনার জন্য কোনো ছাড় আছে কি না দেখে বলছি।',
  ],
  price: [
    'জি, আজকের দামটা মিলিয়ে বলছি, অফার থাকলে সেটাও জানাবো।',
    'আচ্ছা, দামের ব্যাপারটা এখনই পরিষ্কার করে বলছি।',
    'অবশ্যই, সঠিক দামটা আপনাকে জানাচ্ছি।',
  ],
  stock: [
    'জি, কোন সাইজ আর রং এখন স্টকে আছে, মিলিয়ে নিচ্ছি।',
    'আচ্ছা, পণ্যটা এখন পাওয়া যাচ্ছে কি না জানিয়ে দিচ্ছি।',
    'ঠিক আছে, স্টকের অবস্থাটা এখনই মিলিয়ে বলছি।',
  ],
  order: [
    'খুব ভালো পছন্দ, অর্ডারটা সাজিয়ে নিচ্ছি।',
    'চমৎকার, আপনার অর্ডারের জন্য সব ঠিকঠাক করছি।',
    'জি অবশ্যই, অর্ডারের কাজটা এগিয়ে নিচ্ছি।',
  ],
  search: [
    'জি, আমাদের কালেকশনে আপনার মনের মতো কী আছে খুঁজছি।',
    'আচ্ছা, আপনার জন্য কয়েকটা সুন্দর অপশন বেছে নিচ্ছি।',
    'অবশ্যই, দোকানে কী কী আছে এখনই মিলিয়ে দেখাচ্ছি।',
  ],
  general: [
    'জি, বুঝতে পেরেছি, আপনার জন্য সঠিক উত্তরটা তৈরি করছি।',
    'আচ্ছা, খুব ভালো প্রশ্ন, এখনই মিলিয়ে বলছি।',
    'অবশ্যই, এক মুহূর্ত, ঠিক তথ্যটা আপনাকে দিচ্ছি।',
    'ঠিক আছে, আপনার কথাটা মাথায় রেখে উত্তরটা সাজাচ্ছি।',
  ],
};

/** Said when the AI starts a lookup (server chat/stream "tool" events). */
const TOOL_LINES: Record<string, string[]> = {
  delivery_info: ['আপনার জেলার ডেলিভারি চার্জটা সিস্টেম থেকে মিলিয়ে নিচ্ছি।', 'ডেলিভারির হিসাবটা সিস্টেমে বের করছি।'],
  order_status: ['অর্ডারের সর্বশেষ খবরটা সিস্টেম থেকে আনছি।', 'আপনার অর্ডারটা সিস্টেমে খুঁজে নিচ্ছি।'],
  product_details: ['পণ্যটার পুরো বিবরণ খুলে দেখছি, যাতে ঠিক তথ্য দিতে পারি।', 'পণ্যটার খুঁটিনাটি তথ্যগুলো মিলিয়ে নিচ্ছি।'],
  search_products: ['আমাদের পুরো দোকানে খুঁজে দেখছি, আরেকটু সময় দিন।', 'পুরো কালেকশন ঘেঁটে দেখছি।'],
  record_complaint: ['আপনার অভিযোগটা দোকানের টিমের কাছে লিখে রাখছি।'],
};

/** A short "almost ready" when the answer still hasn't come after the first line. */
const STILL_LINES = [
  'প্রায় হয়ে গেছে, আর এক মুহূর্ত।',
  'আরেকটু সময় দিন, একদম সঠিক তথ্যটা দিতে চাই।',
  'ধন্যবাদ অপেক্ষা করার জন্য, এখনই বলছি।',
];

/** One line of `lines`, never the line said last time. */
function pickLine(lines: string[], last: string | null): string {
  const choices = lines.length > 1 ? lines.filter((l) => l !== last) : lines;
  return choices[Math.floor(Math.random() * choices.length)];
}

/** Remembers the last filler said in this tab, so two turns in a row never open with the same words. */
let lastLine: string | null = null;

export function firstFiller(shopperText: string): string {
  lastLine = pickLine(FIRST_LINES[topicOf(shopperText)], lastLine);
  return lastLine;
}

export function toolFiller(tool: string): string | null {
  const lines = TOOL_LINES[tool];
  if (!lines) return null;
  lastLine = pickLine(lines, lastLine);
  return lastLine;
}

export function stillFiller(): string {
  lastLine = pickLine(STILL_LINES, lastLine);
  return lastLine;
}

/** Lines worth making ahead of time (while the call is quiet), so the first ones play at once: the general and "almost ready" lines. */
export function linesToPrepare(): string[] {
  return [...FIRST_LINES.general, ...STILL_LINES, ...FIRST_LINES.search, ...FIRST_LINES.price];
}
