'use client';

import { useCallback, useEffect, useState } from 'react';

// English / Bangla for the StorePal tracking screens (tracking-plan.md Step 4). The server sends
// timeline titles and notices in fixed English wording; the table below is keyed by that exact
// wording, and anything not in it simply shows in English, so a new server line never breaks the page.

export type TrackLang = 'en' | 'bn';

const STORAGE_KEY = 'storepal-track-lang';

/** English by default; remembers the shopper's choice, and starts in Bangla for a Bangla browser. */
export function useTrackLang(): [TrackLang, (lang: TrackLang) => void] {
  const [lang, setLangState] = useState<TrackLang>('en');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') {
        setLangState(saved);
        return;
      }
    } catch {
      // storage blocked: fall through to the browser language
    }
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('bn')) setLangState('bn');
  }, []);
  const setLang = useCallback((next: TrackLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not remembered, still applied now
    }
  }, []);
  return [lang, setLang];
}

export type UiKey =
  | 'orderTracking'
  | 'order'
  | 'placed'
  | 'progress'
  | 'shippedWith'
  | 'trackingId'
  | 'expectedBy'
  | 'runningLate'
  | 'yourRider'
  | 'callRider'
  | 'trackOn'
  | 'copied'
  | 'copy'
  | 'history'
  | 'noHistory'
  | 'items'
  | 'total'
  | 'paidOnline'
  | 'cod'
  | 'paidInAdvance'
  | 'dueOnDelivery'
  | 'deliveryTo'
  | 'needHelp'
  | 'helpText'
  | 'cancelTitle'
  | 'cancelHelp'
  | 'cancelOrder'
  | 'cancelWhy'
  | 'cancelChangedMind'
  | 'cancelMistake'
  | 'cancelElsewhere'
  | 'cancelConfirm'
  | 'cancelKeep'
  | 'cancelling'
  | 'cancelPickReason'
  | 'cancelDone'
  | 'cancelCallStore'
  | 'whatsapp'
  | 'liveNote'
  | 'lastChecked'
  | 'trackYourOrder'
  | 'lookupIntro'
  | 'orderNumber'
  | 'phoneNumber'
  | 'trackButton'
  | 'looking'
  | 'recentOrders'
  | 'thanks'
  | 'returnedNote'
  // A POS sale's page is an in-store receipt (POS-system-plan.md Step 5).
  | 'receipt'
  | 'boughtInStore'
  | 'subtotal'
  | 'vatIncluded'
  | 'vat'
  | 'paidWith';

const UI: Record<TrackLang, Record<UiKey, string>> = {
  en: {
    orderTracking: 'Order tracking',
    order: 'Order',
    placed: 'Placed',
    progress: 'Order progress',
    shippedWith: 'Shipped with',
    trackingId: 'Tracking ID',
    expectedBy: 'Expected by',
    runningLate: 'Running late. It was expected by',
    yourRider: 'Your delivery rider',
    callRider: 'Call',
    trackOn: 'Track on',
    copied: 'Copied',
    copy: 'Copy',
    history: 'Order history',
    noHistory: 'Updates will appear here as your order moves.',
    items: 'Items',
    total: 'Total',
    paidOnline: 'Paid online',
    cod: 'Cash on delivery',
    paidInAdvance: 'Paid in advance',
    dueOnDelivery: 'Pay on delivery',
    deliveryTo: 'Delivering to',
    needHelp: 'Need help?',
    helpText: 'Questions about this order? Message the store and quote your order number.',
    cancelTitle: 'Changed your mind?',
    cancelHelp: 'You can cancel this order until the store confirms it.',
    cancelOrder: 'Cancel order',
    cancelWhy: 'Why are you cancelling?',
    cancelChangedMind: 'I changed my mind',
    cancelMistake: 'I ordered by mistake',
    cancelElsewhere: 'I bought it from somewhere else',
    cancelConfirm: 'Yes, cancel my order',
    cancelKeep: 'Keep my order',
    cancelling: 'Cancelling…',
    cancelPickReason: 'Please pick a reason.',
    cancelDone: 'Your order has been cancelled.',
    cancelCallStore: 'The store has started on this order. To cancel it, please call the store.',
    whatsapp: 'Message on WhatsApp',
    liveNote: 'This page updates by itself.',
    lastChecked: 'Last checked',
    trackYourOrder: 'Track your order',
    lookupIntro: 'Enter your order number and the phone number you used when ordering.',
    orderNumber: 'Order number',
    phoneNumber: 'Phone number',
    trackButton: 'Track order',
    looking: 'Looking…',
    recentOrders: 'Your recent orders',
    thanks: 'Thank you! Your order is placed.',
    returnedNote: 'This parcel was returned to the store.',
    receipt: 'Your receipt',
    boughtInStore: 'Bought in store on',
    subtotal: 'Subtotal',
    vatIncluded: 'Includes VAT',
    vat: 'VAT',
    paidWith: 'Paid with',
  },
  bn: {
    orderTracking: 'অর্ডার ট্র্যাকিং',
    order: 'অর্ডার',
    placed: 'অর্ডারের তারিখ',
    progress: 'অর্ডারের অগ্রগতি',
    shippedWith: 'পাঠানো হয়েছে',
    trackingId: 'ট্র্যাকিং আইডি',
    expectedBy: 'আনুমানিক ডেলিভারি',
    runningLate: 'দেরি হচ্ছে। প্রত্যাশিত তারিখ ছিল',
    yourRider: 'আপনার ডেলিভারি রাইডার',
    callRider: 'কল করুন',
    trackOn: 'ট্র্যাক করুন',
    copied: 'কপি হয়েছে',
    copy: 'কপি',
    history: 'অর্ডারের ইতিহাস',
    noHistory: 'অর্ডার এগোলে এখানে আপডেট দেখা যাবে।',
    items: 'পণ্যসমূহ',
    total: 'মোট',
    paidOnline: 'অনলাইনে পরিশোধিত',
    cod: 'ক্যাশ অন ডেলিভারি',
    paidInAdvance: 'আগেই পরিশোধিত',
    dueOnDelivery: 'ডেলিভারির সময় পরিশোধ',
    deliveryTo: 'ডেলিভারি ঠিকানা',
    needHelp: 'সাহায্য লাগবে?',
    helpText: 'এই অর্ডার নিয়ে প্রশ্ন থাকলে দোকানে মেসেজ করুন এবং অর্ডার নম্বরটি জানান।',
    cancelTitle: 'মত বদলেছেন?',
    cancelHelp: 'দোকান কনফার্ম করার আগে পর্যন্ত আপনি এই অর্ডার বাতিল করতে পারবেন।',
    cancelOrder: 'অর্ডার বাতিল করুন',
    cancelWhy: 'কেন বাতিল করছেন?',
    cancelChangedMind: 'আমি মত বদলেছি',
    cancelMistake: 'ভুলে অর্ডার দিয়েছি',
    cancelElsewhere: 'অন্য জায়গা থেকে কিনেছি',
    cancelConfirm: 'হ্যাঁ, আমার অর্ডার বাতিল করুন',
    cancelKeep: 'অর্ডার রাখুন',
    cancelling: 'বাতিল হচ্ছে…',
    cancelPickReason: 'একটি কারণ বেছে নিন।',
    cancelDone: 'আপনার অর্ডার বাতিল করা হয়েছে।',
    cancelCallStore: 'দোকান এই অর্ডারের কাজ শুরু করেছে। বাতিল করতে হলে দোকানে ফোন করুন।',
    whatsapp: 'হোয়াটসঅ্যাপে মেসেজ করুন',
    liveNote: 'এই পেজ নিজে থেকেই আপডেট হয়।',
    lastChecked: 'সর্বশেষ দেখা হয়েছে',
    trackYourOrder: 'আপনার অর্ডার ট্র্যাক করুন',
    lookupIntro: 'অর্ডার করার সময় যে ফোন নম্বর দিয়েছিলেন এবং আপনার অর্ডার নম্বর লিখুন।',
    orderNumber: 'অর্ডার নম্বর',
    phoneNumber: 'ফোন নম্বর',
    trackButton: 'ট্র্যাক করুন',
    looking: 'খোঁজা হচ্ছে…',
    recentOrders: 'আপনার সাম্প্রতিক অর্ডার',
    thanks: 'ধন্যবাদ! আপনার অর্ডার গ্রহণ করা হয়েছে।',
    returnedNote: 'এই পার্সেলটি দোকানে ফেরত এসেছে।',
    receipt: 'আপনার রসিদ',
    boughtInStore: 'দোকান থেকে কেনা হয়েছে',
    subtotal: 'উপমোট',
    vatIncluded: 'ভ্যাট সহ',
    vat: 'ভ্যাট',
    paidWith: 'পরিশোধ',
  },
};

export function ui(lang: TrackLang, key: UiKey): string {
  return UI[lang][key];
}

const STATUS_LABEL_BN: Record<string, string> = {
  'Order received': 'অর্ডার গৃহীত',
  'Being prepared': 'প্রস্তুত করা হচ্ছে',
  'On the way': 'পথে আছে',
  Delivered: 'ডেলিভারি হয়েছে',
  'On hold': 'স্থগিত',
  'Payment started': 'পেমেন্ট শুরু হয়েছে',
  'Partial payment pending': 'আংশিক পেমেন্ট বাকি',
  'Payment failed': 'পেমেন্ট ব্যর্থ',
  Cancelled: 'বাতিল',
  Returned: 'ফেরত এসেছে',
  Refunded: 'টাকা ফেরত দেওয়া হয়েছে',
  'Item unavailable': 'পণ্যটি পাওয়া যাচ্ছে না',
};

/** An order status label (from orderStatusDisplay.ts) in the chosen language. */
export function statusText(lang: TrackLang, label: string): string {
  return lang === 'bn' ? (STATUS_LABEL_BN[label] ?? label) : label;
}

const TITLE_BN: Record<string, string> = {
  'Order received': 'অর্ডার গ্রহণ করা হয়েছে',
  'Payment received': 'পেমেন্ট পাওয়া গেছে',
  'Order confirmed': 'অর্ডার নিশ্চিত করা হয়েছে',
  'Partial payment pending': 'আংশিক পেমেন্ট বাকি',
  'Order on hold': 'অর্ডার স্থগিত আছে',
  'On the way': 'পথে আছে',
  Delivered: 'ডেলিভারি সম্পন্ন হয়েছে',
  'Order cancelled': 'অর্ডার বাতিল হয়েছে',
  'Payment failed': 'পেমেন্ট ব্যর্থ হয়েছে',
  'Parcel returned to the store': 'পার্সেল দোকানে ফেরত এসেছে',
  Refunded: 'টাকা ফেরত দেওয়া হয়েছে',
  'Item unavailable': 'পণ্যটি পাওয়া যাচ্ছে না',
  'In transit': 'পার্সেল পথে আছে',
  'Out for delivery': 'ডেলিভারির জন্য বের হয়েছে',
  'At the sorting hub': 'সর্টিং হাবে আছে',
  'Reached the local delivery hub': 'স্থানীয় ডেলিভারি হাবে পৌঁছেছে',
  'Delivery attempt failed': 'ডেলিভারির চেষ্টা সফল হয়নি',
  'Parcel on hold': 'পার্সেল স্থগিত আছে',
  'Delivery area being updated': 'ডেলিভারি এলাকা হালনাগাদ হচ্ছে',
  'Part of your order delivered': 'অর্ডারের একাংশ ডেলিভারি হয়েছে',
  'Problem with the parcel': 'পার্সেলে সমস্যা হয়েছে',
  'Parcel on its way back to the store': 'পার্সেল দোকানে ফেরত যাচ্ছে',
  'Delivery being re-arranged': 'ডেলিভারি নতুন করে ঠিক করা হচ্ছে',
  'On its way with our rider': 'আমাদের রাইডারের সাথে পথে আছে',
};

const DETAIL_BN: Record<string, string> = {
  'The store is preparing your order.': 'দোকান আপনার অর্ডার প্রস্তুত করছে।',
  'Waiting for your payment to complete.': 'আপনার পেমেন্ট সম্পন্ন হওয়ার অপেক্ষায়।',
  'Waiting for your confirmation.': 'আপনার নিশ্চিতকরণের অপেক্ষায়।',
  'A delivery attempt didn’t work out. The courier will contact you and try again.':
    'ডেলিভারির চেষ্টা সফল হয়নি। কুরিয়ার আপনার সাথে যোগাযোগ করে আবার চেষ্টা করবে।',
  'A delivery attempt didn’t work out. The store will be in touch.': 'ডেলিভারির চেষ্টা সফল হয়নি। দোকান আপনার সাথে যোগাযোগ করবে।',
  'Your parcel is on hold with the courier for now.': 'আপনার পার্সেলটি আপাতত কুরিয়ারের কাছে স্থগিত আছে।',
  'Part of this order was delivered.': 'এই অর্ডারের একাংশ ডেলিভারি হয়েছে।',
  'There’s a problem with this parcel. Please contact the store.': 'এই পার্সেলে সমস্যা হয়েছে। অনুগ্রহ করে দোকানের সাথে যোগাযোগ করুন।',
  'The courier is updating your delivery area. It may take a little longer.': 'কুরিয়ার আপনার ডেলিভারি এলাকা হালনাগাদ করছে। একটু বেশি সময় লাগতে পারে।',
};

/** A timeline title ("Booked with Pathao" included) in the chosen language. */
export function timelineTitle(lang: TrackLang, title: string): string {
  if (lang === 'en') return title;
  const booked = /^Booked with (.+)$/.exec(title);
  if (booked) return `${booked[1]}-এ বুক করা হয়েছে`;
  const handed = /^Handed to (.+)$/.exec(title);
  if (handed) return `${handed[1]}-এর কাছে হস্তান্তর করা হয়েছে`;
  const picked = /^Picked up by (.+)$/.exec(title);
  if (picked) return `${picked[1]} পার্সেলটি সংগ্রহ করেছে`;
  return TITLE_BN[title] ?? title;
}

export function timelineDetail(lang: TrackLang, detail: string): string {
  return lang === 'bn' ? (DETAIL_BN[detail] ?? detail) : detail;
}

const STAGE_BN: Record<string, string> = {
  Booked: 'বুক হয়েছে',
  'Picked up': 'সংগ্রহ হয়েছে',
  'In transit': 'পথে আছে',
  'Out for delivery': 'ডেলিভারির পথে',
  Delivered: 'ডেলিভারি হয়েছে',
};

export function stageText(lang: TrackLang, label: string): string {
  return lang === 'bn' ? (STAGE_BN[label] ?? label) : label;
}
