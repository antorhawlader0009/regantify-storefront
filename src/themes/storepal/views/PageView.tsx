import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

interface PageViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  title: string;
  content: string | null;
}

/** Store > Pages' public rendering (About Us, Contact Us, etc — see reference screenshot). */
export function PageView({ subdomain, storeName, categories, title, content }: PageViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-[26px] sm:text-[32px] font-bold text-ink leading-tight mb-6">{title}</h1>
        {content ? (
          <div
            // Headings, links and list spacing for the store's own pages and the demo pages (headings used to look like body text).
            className="max-w-[68ch] rounded-lg border border-line bg-surface p-5 sm:p-8 text-[15px] text-ink/85 leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:font-semibold [&_strong]:text-ink [&_h2]:mt-7 [&_h2]:mb-2.5 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-ink [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_em]:text-muted [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-[14px] text-muted">This page has no content yet.</p>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} aboutBlurb={title === 'About Us' ? content : undefined} />
    </div>
  );
}
