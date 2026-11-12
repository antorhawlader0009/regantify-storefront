import type { StorefrontLandingPageData } from '@/lib/storefrontApi';

/*
 * The landing page's own words (order form, timer, buttons) in English or Bangla. Most landing pages in Bangladesh are
 * Facebook / TikTok ad pages written in Bangla, and an English order form under a Bangla page loses orders, so the page
 * speaks Bangla when the store's language is Bangla OR the seller wrote the page itself in Bangla (Bengali letters in
 * its texts). Nothing to set: it follows what the seller already wrote. Numbers stay in English digits (the owner's rule).
 */
export type LandingLang = 'en' | 'bn';

const BENGALI = /[ঀ-৿]/;

function textsOf(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => textsOf(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => textsOf(v, out));
}

/** What a shopper wants to know before ordering, shown under the price: the delivery charges and whether they pay on delivery. */
export interface LandingDelivery {
  inside: number;
  outside: number;
  cod: boolean;
}

export function landingDelivery(data: StorefrontLandingPageData): LandingDelivery | null {
  const inside = Number(data.store.insideDhakaCharge);
  const outside = Number(data.store.outsideDhakaCharge);
  if (!Number.isFinite(inside) || !Number.isFinite(outside)) return null;
  // The store answer also carries the checkout's payment methods (read loosely: the type doesn't list them).
  const gateways = (data.store as { paymentGateways?: Array<{ type: string }> }).paymentGateways;
  return { inside, outside, cod: !gateways || gateways.some((g) => g.type === 'COD') };
}

export function landingLang(data: StorefrontLandingPageData): LandingLang {
  if (data.store.designSettings?.storeLanguage === 'bn') return 'bn';
  const texts: string[] = [data.landingPage.title ?? ''];
  for (const s of data.landingPage.sections) textsOf(s.props, texts);
  return texts.some((t) => BENGALI.test(t)) ? 'bn' : 'en';
}

const BN: Record<string, string> = {
  'Submit Your Order Information': 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন',
  'Full Name': 'আপনার নাম',
  'Your name': 'আপনার নাম লিখুন',
  'Mobile Number': 'মোবাইল নাম্বার',
  'Full Address': 'সম্পূর্ণ ঠিকানা',
  'House, road, area or village, and a nearby landmark': 'বাসা/রোড নং, এলাকা বা গ্রাম, কাছের চেনা জায়গা',
  District: 'জেলা',
  'Thana / Upazila': 'থানা / উপজেলা',
  'Select your district and thana': 'জেলা ও থানা বাছুন',
  'Choose a district first': 'আগে জেলা বাছুন',
  'Other (type it)': 'অন্য (লিখে দিন)',
  'Type your district': 'আপনার জেলা লিখুন',
  'Type your thana / upazila': 'আপনার থানা / উপজেলা লিখুন',
  'District & Thana / Upazila': 'জেলা ও থানা / উপজেলা',
  Search: 'খুঁজুন',
  'Shipping Option': 'ডেলিভারি এলাকা',
  'Inside Dhaka': 'ঢাকার ভেতরে',
  'Around Dhaka': 'ঢাকার আশেপাশে',
  'Outside Dhaka': 'ঢাকার বাইরে',
  delivery: 'ডেলিভারি চার্জ',
  Note: 'নোট',
  'Anything we should know? (optional)': 'কিছু জানাতে চাইলে লিখুন (ঐচ্ছিক)',
  'Your order': 'আপনার অর্ডার',
  'No product is set up for this order form yet.': 'এই ফর্মে এখনো কোনো পণ্য যোগ করা হয়নি।',
  'Select at least one product.': 'অন্তত একটি পণ্য বাছুন।',
  'This option is out of stock': 'এটি স্টকে নেই',
  'Out of stock': 'স্টকে নেই',
  'In stock': 'স্টকে আছে',
  Subtotal: 'পণ্যের দাম',
  'Delivery Charge': 'ডেলিভারি চার্জ',
  VAT: 'ভ্যাট',
  'Platform Charge': 'প্ল্যাটফর্ম চার্জ',
  'Free shipping': 'ফ্রি ডেলিভারি',
  Coupon: 'কুপন',
  Total: 'সর্বমোট',
  applied: 'যোগ হয়েছে',
  Remove: 'বাদ দিন',
  'Enter coupon code': 'কুপন কোড লিখুন',
  'Checking…': 'দেখছি…',
  Apply: 'যোগ করুন',
  'Have Coupon?': 'কুপন আছে?',
  'Payment Method': 'পেমেন্ট পদ্ধতি',
  'Cash on Delivery': 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা)',
  'Online Payment': 'অনলাইন পেমেন্ট',
  '(bKash, Nagad, cards & more)': '(বিকাশ, নগদ, কার্ড ইত্যাদি)',
  'Verify your phone number': 'আপনার মোবাইল নাম্বার যাচাই করুন',
  'We sent a 6-digit code to {phone}. Enter it to place your order.': '{phone} নাম্বারে ৬ সংখ্যার একটি কোড পাঠানো হয়েছে। অর্ডার করতে কোডটি লিখুন।',
  'Enter code': 'কোড লিখুন',
  'Sending…': 'পাঠানো হচ্ছে…',
  'Resend code': 'আবার কোড পাঠান',
  'Orders are paused until {date}.': '{date} পর্যন্ত অর্ডার বন্ধ আছে।',
  'Orders are paused for now.': 'এখন অর্ডার বন্ধ আছে।',
  'Delivery starts from {date}.': '{date} থেকে ডেলিভারি শুরু হবে।',
  'Delivery starts when the store is back.': 'দোকান খোলার পর ডেলিভারি শুরু হবে।',
  'Sending verification code…': 'যাচাই কোড পাঠানো হচ্ছে…',
  'Redirecting to payment…': 'পেমেন্ট পেজে যাচ্ছে…',
  'Placing order…': 'অর্ডার হচ্ছে…',
  'Verify & Place Order': 'যাচাই করে অর্ডার করুন',
  'Place Order': 'অর্ডার কনফার্ম করুন',
  'Choose {option} for {product}.': '{product} এর {option} বাছুন।',
  '{product} ({choice}) is out of stock. Choose another option.': '{product} ({choice}) স্টকে নেই। অন্যটি বাছুন।',
  'Add a house or road number, a village name or a nearby landmark so the rider can find you.':
    'বাড়ি বা রোড নম্বর, গ্রামের নাম বা কাছের কোনো চেনা জায়গা লিখুন, যাতে রাইডার সহজে খুঁজে পান।',
  // useCheckout's own errors.
  'Enter your full name.': 'আপনার নাম লিখুন।',
  'Enter a valid 11-digit phone number.': 'সঠিক ১১ সংখ্যার মোবাইল নাম্বার লিখুন (যেমন 01XXXXXXXXX)।',
  'Enter your delivery address.': 'ডেলিভারির ঠিকানা লিখুন।',
  // Lead form.
  'Enter your name.': 'আপনার নাম লিখুন।',
  Email: 'ইমেইল',
  Submit: 'পাঠান',
  'Submitting...': 'পাঠানো হচ্ছে...',
  'Thank you! We will contact you shortly.': 'ধন্যবাদ! আমরা শিগগিরই আপনার সাথে যোগাযোগ করব।',
  'Could not submit your information. Please try again.': 'তথ্য পাঠানো যায়নি। আবার চেষ্টা করুন।',
  // Timer and buttons.
  Days: 'দিন',
  Hrs: 'ঘণ্টা',
  Min: 'মিনিট',
  Sec: 'সেকেন্ড',
  'This offer has ended.': 'অফারটি শেষ হয়ে গেছে।',
  'Order Now': 'অর্ডার করুন',
  '{percent}% off': '{percent}% ছাড়',
  'Cash on delivery': 'ক্যাশ অন ডেলিভারি',
  'Delivery inside Dhaka {amount}': 'ঢাকার ভেতরে ডেলিভারি {amount}',
  'Outside Dhaka {amount}': 'ঢাকার বাইরে {amount}',
  'Free delivery': 'ফ্রি ডেলিভারি',
  'Tap the photo to zoom': 'বড় করে দেখতে ছবিতে চাপুন',
  'Pay the delivery person when the product reaches you.': 'পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে টাকা দিন।',
};

/** The landing page's words in its language; `{name}` placeholders are filled from `vars`. Unknown text stays as it is. */
export function landingT(lang: LandingLang, text: string, vars?: Record<string, string>): string {
  let out = lang === 'bn' ? (BN[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, v);
  return out;
}
