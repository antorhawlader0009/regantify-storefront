'use client';

import { useStorePalDesign } from './designSettings';

/**
 * Store > Design > "Store language": StorePal's own buttons and labels in Bangla. Keyed by the
 * English text the component already shows, so a missing entry just stays English. Product
 * names, descriptions and anything the vendor typed are never translated. The checkout dialog
 * keeps its own bn/en switch (CheckoutDialog.tsx).
 */
const BN: Record<string, string> = {
  // Product card
  'Add to Cart': 'কার্টে যোগ করুন',
  'Buy Now': 'এখনই কিনুন',
  Added: 'যোগ হয়েছে',
  // Product page
  Quantity: 'পরিমাণ',
  'Max available quantity selected.': 'যতগুলো আছে সবগুলো নেওয়া হয়েছে।',
  'Minimum order:': 'সর্বনিম্ন অর্ডার:',
  'Select an option above first.': 'আগে উপরের একটি অপশন বেছে নিন।',
  'Added to cart': 'কার্টে যোগ হয়েছে',
  'View cart': 'কার্ট দেখুন',
  'Watch product video': 'পণ্যের ভিডিও দেখুন',
  'Cash on delivery': 'ক্যাশ অন ডেলিভারি',
  'Quality checked': 'মান যাচাই করা',
  'Fast delivery': 'দ্রুত ডেলিভারি',
  'Delivery in 20–25 days': '২০–২৫ দিনে ডেলিভারি',
  Cancel: 'বাতিল',
  Continue: 'চালিয়ে যান',
  'View Product': 'বিস্তারিত দেখুন',
  'Request a price': 'দাম জানতে চান',
  'Price on request': 'দাম জানতে যোগাযোগ করুন',
  'Out of Stock': 'স্টক নেই',
  'Out of stock': 'স্টক নেই',
  'In stock': 'স্টকে আছে',
  'units in stock': 'টি স্টকে আছে',
  'Available for pre-order': 'প্রি-অর্ডার করা যাবে',
  'No image': 'ছবি নেই',
  'Select an option first.': 'আগে একটি অপশন বেছে নিন।',
  'Add to wishlist': 'পছন্দের তালিকায় রাখুন',
  'Remove from wishlist': 'পছন্দের তালিকা থেকে সরান',
  // Header
  'Search Your Product By Product Name, Code…': 'পণ্যের নাম বা কোড দিয়ে খুঁজুন…',
  'Search products': 'পণ্য খুঁজুন',
  Category: 'ক্যাটাগরি',
  'Sub Category': 'সাব ক্যাটাগরি',
  Menu: 'মেনু',
  'Cash On Delivery All Over Bangladesh': 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
  'Guaranteed Pre-order Delivery in 20-25 Days': 'প্রি-অর্ডার ২০-২৫ দিনে ডেলিভারি',
  // Cart
  Cart: 'কার্ট',
  'Your cart is empty': 'আপনার কার্ট খালি',
  'Add a product and it will show up here.': 'পণ্য যোগ করলে এখানে দেখাবে।',
  'Continue shopping': 'কেনাকাটা চালিয়ে যান',
  'Pre-order': 'প্রি-অর্ডার',
  'You save': 'আপনার সাশ্রয়',
  Subtotal: 'সাবটোটাল',
  'Delivery, coupons and gift cards are applied at checkout.': 'ডেলিভারি চার্জ, কুপন আর গিফট কার্ড চেকআউটে যোগ হবে।',
  Checkout: 'অর্ডার করুন',
  // Wishlist
  Wishlist: 'পছন্দের তালিকা',
  'Your wishlist is empty': 'আপনার পছন্দের তালিকা খালি',
  'Tap the heart on any product to save it here.': 'যেকোনো পণ্যের হার্ট চাপলে এখানে জমা হবে।',
  // Shop / home
  'Sort by latest': 'নতুনগুলো আগে',
  'Price: low to high': 'দাম: কম থেকে বেশি',
  'Price: high to low': 'দাম: বেশি থেকে কম',
  Filters: 'ফিল্টার',
  Clear: 'মুছুন',
  'Price Filter': 'দাম অনুযায়ী',
  Brand: 'ব্র্যান্ড',
  'Nothing here yet': 'এখনো কিছু নেই',
  'No matches': 'কিছু পাওয়া যায়নি',
  'Try adjusting your filters or browsing another category.': 'ফিল্টার বদলে দেখুন বা অন্য ক্যাটাগরিতে খুঁজুন।',
  'Top Selling': 'সবচেয়ে বেশি বিক্রি',
  'Our Customer Review': 'কাস্টমারদের মতামত',
  Shop: 'শপ',
  'Related Products': 'আরও পণ্য',
  'Available offers': 'চলমান অফার',
  'Applied automatically at checkout.': 'চেকআউটে নিজে থেকেই যোগ হবে।',
  'Flash Sale': 'ফ্ল্যাশ সেল',
  // Footer
  'Social Link': 'সোশ্যাল লিংক',
  INFORMATION: 'তথ্য',
  'Your Email': 'আপনার ইমেইল',
  'Thanks for subscribing!': 'সাবস্ক্রাইব করার জন্য ধন্যবাদ!',
};

/** Bangla digits for numbers shown inside a Bangla label. */
export function bnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

/** `t('Add to Cart')`: the store's language for StorePal's own labels (English stays as is). */
export function useStoreText(): (english: string) => string {
  const { storeLanguage } = useStorePalDesign();
  return storeLanguage === 'bn' ? (english) => BN[english] ?? english : (english) => english;
}

/** Same, outside React (e.g. the stock messages built from the design settings). */
export function storeText(language: string | undefined, english: string): string {
  return language === 'bn' ? (BN[english] ?? english) : english;
}
