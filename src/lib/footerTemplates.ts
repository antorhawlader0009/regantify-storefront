/**
 * Storefront mirror of the shared footer template registry — canonical
 * copy lives at server/src/vendor/footer-templates.ts. Keep the two in
 * sync by hand (same convention CLAUDE.md documents for storefrontApi.ts
 * across repos). See that file's own header comment for the full
 * reasoning; this copy only needs the shapes the RENDERER reads (column
 * arrangement + background), not the picker-modal labels/descriptions,
 * which are a client-only (dashboard) concern.
 */

export type FooterTemplateColumn = 'logo' | 'menu' | 'info' | 'about';

export interface FooterTemplateDef {
  columns: FooterTemplateColumn[];
  logoCarriesAbout: boolean;
  background: 'white' | 'band';
  supportsSubscribe: boolean;
}

export const FOOTER_TEMPLATES: Record<string, FooterTemplateDef> = {
  CLASSIC: {
    columns: ['logo', 'menu', 'info'],
    logoCarriesAbout: true,
    background: 'white',
    supportsSubscribe: false,
  },
  SUBSCRIBE: {
    columns: ['logo', 'menu', 'info', 'about'],
    logoCarriesAbout: true,
    background: 'band',
    supportsSubscribe: true,
  },
  STOREFRONT: {
    columns: ['logo', 'menu', 'info', 'about'],
    logoCarriesAbout: false,
    background: 'white',
    supportsSubscribe: true,
  },
  MINIMAL: {
    columns: ['logo', 'menu', 'info'],
    logoCarriesAbout: false,
    background: 'white',
    supportsSubscribe: false,
  },
};

const DEFAULT_TEMPLATE_KEY = 'CLASSIC';

/** Narrow whatever template key the API returns to a known one, defaulting to CLASSIC — same "never crash on an unrecognized value" reasoning as lib/theme.ts's resolveTheme. */
export function resolveFooterTemplate(template: string | null | undefined): FooterTemplateDef {
  if (template && FOOTER_TEMPLATES[template]) return FOOTER_TEMPLATES[template];
  return FOOTER_TEMPLATES[DEFAULT_TEMPLATE_KEY];
}

export const PAYMENT_ICON_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'Amex',
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
  COD: 'Cash on Delivery',
};
