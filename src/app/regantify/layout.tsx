import type { Metadata } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './regantify.css';

// One family for the whole central page: it covers Latin and Bangla alike, so a shopper's Bangla address reads in the same voice.
const hind = Hind_Siliguri({ subsets: ['latin', 'bengali'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--rgf-font' });

// A one-person page: never listed by search engines.
export const metadata: Metadata = { title: 'Sign in with Regantify', robots: { index: false, follow: false } };

/**
 * The central Regantify sign-in page (accounts.ROOT_DOMAIN in production, /regantify locally): Google or SMS-code sign-in for shoppers of every
 * store, and the step where they choose which saved addresses to bring. Outside the store layout on purpose: no store's code runs here.
 */
export default function RegantifyLayout({ children }: { children: React.ReactNode }) {
  return <div className={`rgf ${hind.variable}`}>{children}</div>;
}
