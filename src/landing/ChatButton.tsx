/** Store > Landing Pages > Chat Button — a floating WhatsApp/Messenger-style link (landing-plan.md §4.2, LandingPage.chatButtonEnabled/Link/ImageUrl). Plain anchor, no client JS needed. */
export function ChatButton({ link, imageUrl }: { link: string; imageUrl?: string | null }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg transition-transform hover:scale-105"
      aria-label="Chat with us"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-8 w-8 object-contain" />
      ) : (
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.25.93 4.29 2.45 5.85L3 22l5.34-1.4C9.66 21.16 10.8 21.5 12 21.5c5.52 0 10-4.03 10-9S17.52 2 12 2z" />
        </svg>
      )}
    </a>
  );
}
