'use client';

import Link from 'next/link';
import { useStoreText } from '../lib/storeText';

/**
 * "By posting you agree to this store's terms", under the review and question forms (Google Play's user-generated content rule). The link
 * is the store's Terms page: the store's own if it wrote one, else the standard sample page, so it always opens something
 * (lib/demoPages.ts, slug `terms-and-conditions`).
 */
export function PostingTermsNote({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const [before, after] = t("By posting, you agree to this store's {terms}.").split('{terms}');
  return (
    <p className="m-0 text-[11.5px] text-muted">
      {before}
      <Link href={`/store/${subdomain}/page/terms-and-conditions`} target="_blank" className="underline underline-offset-2 hover:text-ink">
        {t('terms')}
      </Link>
      {after}
    </p>
  );
}
