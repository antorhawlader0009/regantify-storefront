/**
 * Default store pages (2026-10-28, the owner's request: "everything a store needs is there by default, with demo text").
 * A store that has not published its own About / Delivery / Returns / Privacy / Terms page still gets a footer link to each
 * and a sample page at a fixed address, filled with what the store already has (name, phone, address, return days).
 * Nothing is stored: the moment the store publishes its own page of that kind (matched by its address or title words),
 * the demo link and page step aside. Demo pages say they are samples and are never indexed.
 * The slugs and match words are mirrored by hand in client/src/lib/demoPages.ts (the dashboard's Pages list).
 */
export type DemoPageKind = 'ABOUT' | 'DELIVERY' | 'RETURN' | 'PRIVACY' | 'TERMS';
export type DemoLang = 'en' | 'bn';

export interface DemoPageDef {
  kind: DemoPageKind;
  slug: string;
  title: Record<DemoLang, string>;
  /** A published page whose address or title holds one of these covers this kind. */
  match: string[];
}

export const DEMO_PAGES: DemoPageDef[] = [
  { kind: 'ABOUT', slug: 'about-us', title: { en: 'About Us', bn: 'আমাদের সম্পর্কে' }, match: ['about', 'সম্পর্কে'] },
  { kind: 'DELIVERY', slug: 'delivery-policy', title: { en: 'Delivery Policy', bn: 'ডেলিভারি নীতি' }, match: ['delivery', 'shipping', 'ডেলিভারি'] },
  { kind: 'RETURN', slug: 'return-policy', title: { en: 'Return & Refund Policy', bn: 'রিটার্ন ও রিফান্ড নীতি' }, match: ['return', 'refund', 'রিটার্ন', 'রিফান্ড'] },
  { kind: 'PRIVACY', slug: 'privacy-policy', title: { en: 'Privacy Policy', bn: 'প্রাইভেসি নীতি' }, match: ['privacy', 'প্রাইভেসি', 'গোপনীয়তা'] },
  { kind: 'TERMS', slug: 'terms-and-conditions', title: { en: 'Terms & Conditions', bn: 'শর্তাবলী' }, match: ['terms', 'condition', 'শর্ত'] },
];

/** Whether one of the store's own published pages already covers this kind. */
export function pageCovers(def: DemoPageDef, pages: Array<{ slug: string; title: string }>): boolean {
  return pages.some((p) => {
    const text = `${p.slug} ${p.title}`.toLowerCase();
    return def.match.some((w) => text.includes(w));
  });
}

/** The demo pages still needed: the kinds the store has not published a page for, in footer order. */
export function missingDemoPages(pages: Array<{ slug: string; title: string }>): DemoPageDef[] {
  return DEMO_PAGES.filter((d) => !pageCovers(d, pages));
}

export function demoPageBySlug(slug: string): DemoPageDef | null {
  return DEMO_PAGES.find((d) => d.slug === slug) ?? null;
}

export interface DemoFacts {
  storeName: string;
  phone: string | null;
  address: string | null;
  returnDays: number | null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function contactHtml(f: DemoFacts, lang: DemoLang): string {
  const lines = [`<strong>${esc(f.storeName)}</strong>`];
  if (f.address) lines.push(esc(f.address));
  if (f.phone) lines.push(`${lang === 'bn' ? 'ফোন' : 'Phone'}: ${esc(f.phone)}`);
  return `<p>${lines.join('<br>')}</p>`;
}

/** The sample page's HTML (only our own text and the store's escaped facts, so it is safe to render as HTML). */
export function demoPageHtml(kind: DemoPageKind, lang: DemoLang, f: DemoFacts): string {
  const name = esc(f.storeName);
  const bn = lang === 'bn';
  const contact = contactHtml(f, lang);
  const returnWindow = f.returnDays
    ? bn
      ? `পণ্য হাতে পাওয়ার ${f.returnDays} দিনের মধ্যে`
      : `within ${f.returnDays} days of receiving it`
    : bn
      ? 'পণ্যের পাতায় লেখা সময়ের মধ্যে'
      : 'within the time shown on the product page';

  const body: Record<DemoPageKind, string> = bn
    ? {
        ABOUT: `<p>${name}-এ আপনাকে স্বাগতম। আমরা যত্ন করে বাছাই করা পণ্য ন্যায্য দামে আপনার দরজায় পৌঁছে দিই।</p><h2>আমরা কী করি</h2><ul><li>প্রতিটি অর্ডার পাঠানোর আগে পণ্য দেখে নিই।</li><li>সারা বাংলাদেশে ডেলিভারি করি।</li><li>অর্ডার নিয়ে যেকোনো প্রশ্নে সাহায্য করি।</li></ul><h2>যোগাযোগ</h2>${contact}`,
        DELIVERY: `<p>${name} সারা বাংলাদেশে ডেলিভারি করে।</p><h2>ডেলিভারি চার্জ</h2><p>আপনার এলাকার ডেলিভারি চার্জ অর্ডার করার আগে চেকআউটে দেখানো হয়।</p><h2>ডেলিভারির সময়</h2><p>অর্ডার কনফার্ম হওয়ার পর সাধারণত ঢাকার ভেতরে 1-3 দিন এবং ঢাকার বাইরে 3-5 দিন লাগে। ছুটির দিন বা খারাপ আবহাওয়ায় একটু বেশি সময় লাগতে পারে।</p><h2>অর্ডার ট্র্যাক করুন</h2><p>অর্ডার নম্বর ও ফোন নম্বর দিয়ে "অর্ডার ট্র্যাক করুন" পাতায় অর্ডারের অবস্থা দেখতে পারবেন।</p><h2>যোগাযোগ</h2>${contact}`,
        RETURN: `<p>পণ্য নিয়ে কোনো সমস্যা হলে আমরা সমাধান করতে চাই।</p><h2>কখন ফেরত দেওয়া যায়</h2><ul><li>ভুল, ভাঙা বা ত্রুটিপূর্ণ পণ্য পেলে ${returnWindow} আমাদের জানান।</li><li>পণ্য অব্যবহৃত ও আসল প্যাকেটে থাকতে হবে।</li></ul><h2>যেভাবে ফেরত দেবেন</h2><p>অর্ডার নম্বর ও পণ্যের ছবিসহ আমাদের ফোন বা মেসেজ করুন। আমরা পরের ধাপ জানিয়ে দেব।</p><h2>রিফান্ড</h2><p>ফেরত পণ্য হাতে পেয়ে যাচাই করার পর আপনার পছন্দের মাধ্যমে টাকা ফেরত দেওয়া হয়, অথবা পণ্য বদলে দেওয়া হয়।</p><h2>যোগাযোগ</h2>${contact}`,
        PRIVACY: `<p>${name} আপনার তথ্যের নিরাপত্তাকে গুরুত্ব দেয়।</p><h2>আমরা যা নিই</h2><p>অর্ডার ডেলিভারির জন্য আপনার নাম, ফোন নম্বর ও ঠিকানা।</p><h2>যেভাবে ব্যবহার করি</h2><ul><li>অর্ডার কনফার্ম ও ডেলিভারি করতে।</li><li>অর্ডারের খবর জানাতে।</li></ul><p>ডেলিভারির জন্য প্রয়োজনীয় তথ্য কেবল কুরিয়ারকে দেওয়া হয়। আপনার তথ্য আমরা বিক্রি করি না।</p><h2>অ্যাকাউন্ট মুছে ফেলা</h2><p>আপনি নিজেই আপনার অ্যাকাউন্ট মুছে ফেলতে পারেন: অ্যাকাউন্ট মেনুর "অ্যাকাউন্ট মুছুন" থেকে, বা /account/delete পাতায়, বা Regantify অ্যাপ থেকে। মুছলে আপনার লগইন, সংরক্ষিত ঠিকানা, কার্ট ও উইশলিস্ট চলে যায়। আগে দেওয়া অর্ডার দোকানের হিসাব হিসেবে থাকে। আপনার লেখা রিভিউ ও প্রশ্ন আপনার নাম ছাড়া থাকে।</p><h2>যোগাযোগ</h2>${contact}`,
        TERMS: `<p>${name} থেকে অর্ডার করলে আপনি এই শর্তগুলো মেনে নিচ্ছেন।</p><h2>অর্ডার ও দাম</h2><ul><li>চেকআউটে দেখানো দামই চূড়ান্ত।</li><li>স্টক শেষ হলে আমরা আপনাকে জানিয়ে অর্ডার বাতিল করতে পারি।</li></ul><h2>রিভিউ ও প্রশ্ন</h2><p>আপনার লেখা রিভিউ ও প্রশ্ন সৎ ও ভদ্র হতে হবে। স্প্যাম, আপত্তিকর, মিথ্যা বা অন্যের ব্যক্তিগত তথ্য থাকলে আমরা তা লুকিয়ে ফেলতে পারি, আর যে কেউ "রিপোর্ট" বাটন দিয়ে জানাতে পারে।</p><h2>পেমেন্ট</h2><p>চেকআউটে দেখানো যেকোনো পদ্ধতিতে পেমেন্ট করতে পারবেন।</p><h2>যোগাযোগ</h2>${contact}`,
      }
    : {
        ABOUT: `<p>Welcome to ${name}. We pick our products with care and deliver them to your door at a fair price.</p><h2>What we do</h2><ul><li>We check every product before it is sent.</li><li>We deliver all over Bangladesh.</li><li>We help with any question about your order.</li></ul><h2>Contact</h2>${contact}`,
        DELIVERY: `<p>${name} delivers all over Bangladesh.</p><h2>Delivery charge</h2><p>The delivery charge for your area is shown at checkout before you place your order.</p><h2>Delivery time</h2><p>After your order is confirmed it usually takes 1-3 days inside Dhaka and 3-5 days outside Dhaka. Holidays and bad weather can add a little time.</p><h2>Track your order</h2><p>Use the "Track order" page with your order number and phone number to see where your order is.</p><h2>Contact</h2>${contact}`,
        RETURN: `<p>If something is wrong with your order, we want to make it right.</p><h2>When you can return</h2><ul><li>Tell us ${returnWindow} if you received a wrong, damaged or faulty product.</li><li>The product must be unused and in its original packaging.</li></ul><h2>How to return</h2><p>Call or message us with your order number and a photo of the product, and we will tell you the next step.</p><h2>Refunds</h2><p>Once we receive and check the returned product, we refund you the way you prefer or send a replacement.</p><h2>Contact</h2>${contact}`,
        PRIVACY: `<p>${name} takes care of your information.</p><h2>What we collect</h2><p>Your name, phone number and address, so we can deliver your order.</p><h2>How we use it</h2><ul><li>To confirm and deliver your order.</li><li>To tell you about your order.</li></ul><p>We share only what delivery needs with the courier. We never sell your information.</p><h2>Deleting your account</h2><p>You can delete your account yourself: from the account menu ("Delete my account"), on the /account/delete page, or in the Regantify app. Deleting removes your sign-ins, saved addresses, cart and wishlist. Orders you already placed stay with the shop as its records. Reviews and questions you wrote stay without your name.</p><h2>Contact</h2>${contact}`,
        TERMS: `<p>By ordering from ${name}, you agree to these terms.</p><h2>Orders and prices</h2><ul><li>The price shown at checkout is the final price.</li><li>If a product runs out of stock, we may cancel the order and let you know.</li></ul><h2>Reviews and questions</h2><p>Reviews and questions you post must be honest and respectful. We may hide anything that is spam, offensive, false or shows someone's private details, and anyone can report it with the Report button.</p><h2>Payment</h2><p>You can pay with any method shown at checkout.</p><h2>Contact</h2>${contact}`,
      };

  const note = bn
    ? `<p><em>এটি একটি নমুনা পাতা। ${name} শিগগিরই নিজের তথ্য দিয়ে এটি হালনাগাদ করবে।</em></p>`
    : `<p><em>This is a sample page. ${name} will update it with its own details soon.</em></p>`;
  return body[kind] + note;
}
