'use client';

/**
 * Where StorePal's dialogs and drawers are drawn: a holder in <body> that carries the store wrapper's theme, skin,
 * layout, brand colour and fonts (the wrapper in app/store/[subdomain]/layout.tsx). Drawn straight into <body> they
 * fell back to the default colours and fonts, so the checkout and sign-in buttons were orange in every store and a
 * PlayMate store's dialogs were not purple. The holder is outside the sticky header, so the reason for drawing in
 * <body> (a dialog above every other layer) still holds.
 */
const COPIED = ['data-theme', 'data-skin', 'data-layout', 'data-brand-heading', 'style', 'lang'];

export function storePortalRoot(): HTMLElement {
  const wrapper = document.querySelector<HTMLElement>('div[data-theme]');
  if (!wrapper) return document.body;
  let root = document.getElementById('store-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'store-portal-root';
    document.body.appendChild(root);
  }
  for (const name of COPIED) {
    const value = wrapper.getAttribute(name);
    if (value === null) root.removeAttribute(name);
    else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
  }
  return root;
}
