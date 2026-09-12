import type { SocialLinks } from '@/lib/socialLinksApi';

/**
 * Matches the reference site's floating green WhatsApp bubble
 * (bottom-right corner, every page). Driven entirely by Store >
 * Social's whatsappUrl (see Vendor.whatsappUrl) rather than a
 * dedicated contact-number field — Vendor still has no phone/contact
 * field of its own (see this theme's earlier build notes on why the
 * reference's "Order on Whatsapp" product-page button was left
 * unbuilt), but the Social link is exactly a WhatsApp URL already, so
 * the floating bubble doesn't need one. Renders nothing when the
 * vendor hasn't set a WhatsApp link.
 */
export function WhatsAppBubble({ socialLinks }: { socialLinks?: SocialLinks }) {
  const url = socialLinks?.whatsappUrl?.trim();
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] shadow-lg flex items-center justify-center transition-colors"
    >
      <svg viewBox="0 0 32 32" width="24" height="24" fill="white" aria-hidden="true">
        <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.674 4.524 1.84 6.37L4 29l7.84-1.79A11.93 11.93 0 0 0 16.004 27C22.632 27 28 21.627 28 15S22.632 3 16.004 3zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.65 1.06 1.08-4.53-.23-.37A9.72 9.72 0 0 1 6.25 15c0-5.38 4.38-9.75 9.754-9.75 5.375 0 9.746 4.37 9.746 9.75s-4.371 9.75-9.746 9.75zm5.34-7.29c-.293-.147-1.734-.855-2.003-.953-.269-.098-.465-.147-.66.147-.196.293-.758.953-.93 1.148-.171.196-.343.22-.636.073-.293-.147-1.237-.456-2.357-1.455-.871-.777-1.46-1.737-1.631-2.03-.171-.293-.018-.452.128-.598.132-.131.293-.343.44-.514.147-.171.196-.293.293-.489.098-.196.049-.367-.024-.514-.073-.147-.66-1.591-.905-2.18-.238-.572-.481-.494-.66-.503-.171-.008-.367-.01-.563-.01a1.08 1.08 0 0 0-.783.367c-.269.293-1.026 1.002-1.026 2.444s1.05 2.835 1.196 3.031c.147.196 2.066 3.155 5.006 4.424.7.302 1.246.483 1.672.618.702.223 1.34.192 1.845.116.563-.084 1.734-.709 1.978-1.393.244-.685.244-1.271.171-1.393-.073-.123-.269-.196-.563-.343z" />
      </svg>
    </a>
  );
}
