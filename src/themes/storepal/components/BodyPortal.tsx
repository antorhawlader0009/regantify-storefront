'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Draws its children straight into <body>. The store header is `sticky` with its own z-index, which makes it a stacking context: anything
 * drawn inside it (the cart drawer, the checkout and sign-in dialogs) can never rise above a layer outside the header, such as the account
 * dialog (AccountLayout, z-50). Opened from there (Wishlist > Add to Cart), the cart drawer used to sit under that dialog's dark, blurred
 * backdrop. In <body> their own z-index counts again. Nothing is drawn on the server (portals need the document).
 */
export function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
