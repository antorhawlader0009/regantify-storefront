import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { fontVariables } from '@/lib/fonts';
import { CartStoreProvider } from '@/providers/cart-store-provider';
import './globals.css';

// metadataBase lets every page's relative OG/Twitter image URLs resolve to
// full, absolute URLs automatically (required by most social platforms —
// a relative image URL is silently dropped by many link-preview crawlers).
// Falls back to localhost in dev so nothing breaks before ROOT_DOMAIN is
// set — see .env.local.example / middleware.ts.
const rootDomain = process.env.ROOT_DOMAIN?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(rootDomain ? `https://${rootDomain}` : 'http://localhost:3000'),
  title: 'Regantify Store',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="font-sans">
        <NuqsAdapter>
          <CartStoreProvider>{children}</CartStoreProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
