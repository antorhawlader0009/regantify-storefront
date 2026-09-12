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
        <h1 className="text-[32px] font-bold text-ink mb-6">{title}</h1>
        {content ? (
          <div
            className="text-[14px] text-ink/85 leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold"
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
