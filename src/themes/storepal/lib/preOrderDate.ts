import { bnDigits } from './storeText';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

/** "about 20 Nov" / "প্রায় ২০ নভেম্বর" for a pre-order's expected date (YYYY-MM-DD, TellMe idea 64). */
export function preOrderDateText(date: string, language?: string): string {
  const [, m, d] = date.slice(0, 10).split('-').map(Number);
  if (!m || !d) return '';
  return language === 'bn' ? `প্রায় ${bnDigits(d)} ${BN_MONTHS[m - 1]}` : `about ${d} ${EN_MONTHS[m - 1]}`;
}
