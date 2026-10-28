// Server-side data fetching for the public storefront. Every function here
// runs on the server (called from Server Components / generateMetadata),
// never in the browser — so there's no auth token, no axios interceptor,
// just plain fetch() against the NestJS API. Field shapes are kept in
// lockstep with client/src/lib/storefrontApi.ts (the vendor-dashboard
// app's copy of the same public endpoints) since both read the same
// backend response.

import type { TrackedOrder } from '@/lib/checkoutApi';
import type { StorefrontStoreAway } from '@/lib/storeAway';
import { storeSubdomain, type StoreAddress } from '@/lib/storeAddress';
import { currentStoreAddress } from '@/lib/storeRequest';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export type StoreTheme = 'MEDIUM' | 'MINIMAL' | 'STOREPAL';

// Store > Footer — kept in lockstep by hand with
// server/src/vendor/footer-templates.ts (the canonical registry) and its
// mirrored copy at storefront/src/lib/footerTemplates.ts. See
// FooterConfig in the server's schema.prisma for the field-by-field
// reasoning.
export interface StorefrontFooterLink {
  label: string;
  url: string;
}

export interface StorefrontFooterConfig {
  template: string;
  menuTitle: string;
  menuLinks: StorefrontFooterLink[];
  infoTitle: string;
  infoLinks: StorefrontFooterLink[];
  aboutBlurb: string | null;
  showSocialIcons: boolean;
  showSubscribeBlock: boolean;
  subscribeHeading: string;
  subscribeSubheading: string;
  showPaymentIcons: boolean;
  paymentIcons: string[];
  showContact?: boolean;
  contactTitle?: string;
  contactAddress?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  showApps?: boolean;
  appsTitle?: string;
  playStoreUrl?: string | null;
  appStoreUrl?: string | null;
  showCredit?: boolean;
}

/** Which LMS store forms a StorePal product page shows. */
export interface StorefrontLmsForms {
  notifyMe: boolean;
  callMeBack: boolean;
}

/** Store > SEO — mirrors the `seo` object StorefrontService.findVendorBySubdomainOrThrow adds to the public store answer. */
export interface StorefrontSeo {
  allowIndexing: boolean;
  appendStoreName: boolean;
  preferCustomDomain: boolean;
  googleVerification: string | null;
  bingVerification: string | null;
}

/** What a search engine may index on a store — mirrors StorefrontService.getSitemapData. Empty lists when `indexable` is false. */
export interface StorefrontSitemapData {
  subdomain: string;
  customDomain: string | null;
  preferCustomDomain: boolean;
  theme: StoreTheme;
  indexable: boolean;
  products: { slug: string; name: string; updatedAt: string; photos: string[] }[];
  pages: { slug: string; updatedAt: string }[];
  landingPages: { slug: string; updatedAt: string }[];
  collections: { slug: string; updatedAt: string }[];
  campaigns: { slug: string; updatedAt: string }[];
}

export interface StorefrontInfo {
  id: string;
  storeName: string;
  subdomain: string;
  theme: StoreTheme;
  /** Shop and support hours (TellMe idea 73), StorePal only; null = none set. */
  businessHours?: Record<string, { open: boolean; from: string; to: string }> | null;
  /** "Verified seller" (super-admin-new.md Step 12): Super Admin approved the store's verification. StorePal only; `dbid` is its public DBID, if given. */
  verifiedSeller?: { since: string; dbid: string | null } | null;
  /** Gift option (StorePal): the wrap charge and the store's own taka-per-dollar rate for gift senders abroad (null = no dollar prices). */
  giftOption?: { charge: number; usdRate?: number | null } | null;
  // Store > Logo — replaces the plain-text storeName wordmark wherever
  // a theme's header/footer shows it, when set. Nullable: a vendor who
  // hasn't uploaded one yet keeps the existing text-wordmark fallback.
  logoUrl?: string | null;
  // Store > Social — see StorefrontController's socialLinks selection
  // on the backend. Every field is independently nullable; a vendor who
  // hasn't set a given platform simply omits that icon in the footer.
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappUrl?: string | null;
  // Store > Branding — surfaced on every storefront response, same
  // reasoning as the social fields above. Applied at the store/[subdomain]
  // layout (colors/favicon/fonts) and as the homepage's default meta
  // fallback (see page.tsx's generateMetadata) — every field
  // independently nullable, falling back to each theme's own built-in
  // default when unset.
  faviconUrl?: string | null;
  accentColor?: string | null;
  bodyBackgroundColor?: string | null;
  brandHeadingFont?: string | null;
  brandBodyFont?: string | null;
  brandCoverImageUrl?: string | null;
  /** Store > Branding > Website cover photo: the first slide of StorePal's home page hero (not the link-preview picture above). */
  brandSiteCoverUrl?: string | null;
  brandSiteCoverOnly?: boolean;
  brandMetaTitle?: string | null;
  brandMetaDescription?: string | null;
  /** The vendor's own domain (Store > Domain), when they have one. */
  customDomain?: string | null;
  /** Store > SEO: how search engines may see the store. Always present on the store answer (defaults when the vendor saved nothing). */
  seo?: StorefrontSeo;
  // Store > Footer — null when the vendor has never saved one (see
  // FooterConfig's own "singleton, optional" schema comment); each
  // theme's StoreFooter falls back to its own current hardcoded content
  // in that case, so an unconfigured store looks exactly as it did
  // before this feature shipped.
  footerConfig?: StorefrontFooterConfig | null;
  // Settings > Courier Integration > Delivery Charge — see
  // StorefrontController's select on the backend. Read by useCheckout
  // (shared by every theme) instead of a hardcoded constant.
  insideDhakaCharge: string;
  outsideDhakaCharge: string;
  codVatCharge: string;
  // Store > Stock Settings / GDPR Prompt / COD Guard — the shopper-safe
  // slice from StoreSettingsService.toPublicStoreSettings on the backend.
  // Only the StorePal theme reads these. Optional so an older cached
  // response without them behaves like the defaults.
  stockSettings?: StorefrontStockSettings;
  gdprPrompt?: StorefrontGdprPrompt | null;
  codSmsVerification?: 'BEFORE_CHECKOUT' | 'AFTER_CHECKOUT' | null;
  // Store > Design > Custom CSS / Head Scripts / JavaScript Code — only on
  // the store-info response, and null unless the theme is StorePal and the
  // vendor has set something (see StorefrontController.getStore).
  customCode?: StorefrontCustomCode | null;
  // Store > Design > Product Display / Product Card / Site Banner / Header
  // Editor / Layout Settings — same "store-info only, StorePal only" rule
  // as customCode. Read through themes/storepal/lib/designSettings.tsx.
  designSettings?: StorefrontDesignSettings | null;
  // Store > Integrations > Facebook Pixel — same "store-info only, StorePal
  // only" rule as customCode. Null when the vendor has no pixel and no
  // domain verification code. Never includes the CAPI token.
  metaPixel?: StorefrontMetaPixel | null;
  // Store > Integrations > Google Analytics 4 — same "store-info only,
  // StorePal only" rule. Null when the vendor has no Measurement ID.
  // Never includes the Measurement Protocol API secret.
  googleAnalytics?: StorefrontGoogleAnalytics | null;
  // Store > Integrations > Google Tag Manager — same "store-info only,
  // StorePal only" rule. Null when the vendor has no container ID.
  googleTagManager?: StorefrontGoogleTagManager | null;
  // Store > Integrations > TikTok Pixel — same "store-info only, StorePal
  // only" rule. Null when the vendor has no pixel. Never includes the
  // Events API token.
  tiktokPixel?: StorefrontTiktokPixel | null;
  /** LMS store forms on product pages (LMS-plan.md Step 9), StorePal only; null when off. */
  lmsForms?: StorefrontLmsForms | null;
  /** Marketing > Campaigns > Popup, StorePal only (empty on other themes). Newest first. */
  popupCampaigns?: StorefrontPopupCampaign[];
  /** Store > Store Away (holiday mode), StorePal only; null while the store is open. See lib/storeAway.ts. */
  storeAway?: StorefrontStoreAway | null;
}

export interface StorefrontTiktokPixel {
  pixelId: string;
  // Fire TikTok's standard ecommerce events; false = page views only.
  ecommerceEvents: boolean;
  // ttq.identify with the buyer's hashed email/phone at purchase.
  advancedMatching: boolean;
  // True only when the server will send Purchase itself at the vendor's
  // chosen order status, so the browser must not fire it at checkout.
  deferredPurchase: boolean;
}

export interface StorefrontGoogleTagManager {
  containerId: string;
  // Push StorePal's GA4-format ecommerce events to the dataLayer.
  ecommerceEvents: boolean;
  // Add the shopper's hashed email/phone/name to the purchase event.
  customerData: boolean;
  // Only used while the GDPR Prompt is on (see StorefrontGoogleAnalytics).
  consentMode: 'BASIC' | 'ADVANCED';
  // Server-side GTM origin to load gtm.js from, instead of Google's.
  serverContainerUrl: string | null;
}

export interface StorefrontGoogleAnalytics {
  measurementId: string;
  secondaryMeasurementId: string | null;
  // Send StorePal's GA4 ecommerce events; false = page views only.
  ecommerceEvents: boolean;
  // Only used while the GDPR Prompt is on: BASIC loads nothing before
  // consent, ADVANCED loads the tag with every consent type denied.
  consentMode: 'BASIC' | 'ADVANCED';
  debugMode: boolean;
  // The server sends purchase itself (Measurement Protocol), so the
  // browser must not also send it.
  serverPurchase: boolean;
}

export interface StorefrontMetaPixel {
  pixelId: string | null;
  secondaryPixelId: string | null;
  eventMode: 'AUTOMATIC' | 'STOREPAL_DEFINED';
  // "Track without JS SDK": facebook.com/tr image requests, no fbevents.js.
  imgTagTracking: boolean;
  // content="" value for <meta name="facebook-domain-verification">.
  domainVerificationCode: string | null;
  // True only when the server will send Purchase itself at the vendor's
  // chosen order status, so the browser must not fire it at checkout.
  deferredPurchase: boolean;
  // The vendor has a working Conversions API token: relay browser events
  // to the server for a server-side copy (see lib/metaPixel.ts).
  serverEvents?: boolean;
}

export type StorefrontMenuItemType = 'PAGE' | 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'OTHER' | 'CUSTOM';

export interface StorefrontMenuItem {
  id: string;
  label: string;
  type: StorefrontMenuItemType;
  // Page/product slug, category/brand name, ACCOUNT|SHOP|TRACK_ORDER, or a URL.
  value: string;
}

export interface StorefrontDesignSettings {
  productImageShape: 'SQUARE' | 'PORTRAIT';
  galleryStyle: 'LEFT' | 'BOTTOM' | 'RIGHT';
  inStockMessage: string | null;
  outOfStockMessage: string | null;
  preOrderMessage: string | null;
  cardShowSummary: boolean;
  cardShowDefaultButton: boolean;
  cardShowViewButton: boolean;
  cardShowBuyNow: boolean;
  cardShowAddToCart: boolean;
  cardOptionsAsButtons: boolean;
  cardOptionsAsSelect: boolean;
  cardDisplayAsCard: boolean;
  cardShowVideo: boolean;
  cardShowWishlist: boolean;
  /** The one colour of every product badge; null = the theme's accent. */
  productBadgeColor?: string | null;
  bannerEnabled: boolean;
  /** Scheduled banners (TellMe idea 110); the one whose time is on now replaces the usual banner. */
  /** The store's counted figures (TellMe idea 147), already rounded down; null/missing = nothing to show. */
  reputation?: { orders?: number; rating?: { avg: number; count: number }; reviews?: { percent: number; count: number }; since?: number } | null;
  trustStrip?: { enabled: boolean; items: { icon: string; title: string; text: string }[]; product: boolean; checkout: boolean; home: boolean };
  bannerSchedule?: { id: string; content: string; startAt: string | null; endAt: string | null; style: 'MARQUEE' | 'STATIC' | null; backgroundColor: string | null }[];
  bannerContent: string | null;
  bannerStyle: 'STATIC' | 'MARQUEE';
  bannerBackgroundColor: string | null;
  layoutType: 'COMPACT' | 'EXTENDED';
  siteMenu: StorefrontMenuItem[];
  headerLeftMenu: StorefrontMenuItem[];
  headerRightMenu: StorefrontMenuItem[];
  /** "Call Us Now" and a number beside the search bar; off by default. */
  /** "Someone bought" popup (TellMe idea 123): off by default. */
  /** Checkout form fields (TellMe idea 128); missing = today's form. */
  checkoutAltPhone?: 'HIDDEN' | 'OPTIONAL' | 'REQUIRED';
  checkoutEmail?: 'HIDDEN' | 'OPTIONAL' | 'REQUIRED';
  checkoutThana?: 'OPTIONAL' | 'REQUIRED';
  checkoutNote?: 'SHOWN' | 'HIDDEN';
  recentBuyersEnabled?: boolean;
  recentBuyersPosition?: 'LEFT' | 'RIGHT';
  recentBuyersSeconds?: number;
  headerPhoneEnabled?: boolean;
  headerPhoneLabel?: string | null;
  headerPhone?: string | null;
  headerLogoSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  headerShowCartTotal?: boolean;
  /** Install as app: the "add to home screen" banner for returning shoppers, and the name under the icon. */
  appInstallEnabled?: boolean;
  appName?: string | null;
  headerShowLogo?: boolean;
  headerShowStoreName?: boolean;
  mobileMenu: StorefrontMenuItem[];
  // Store > Design > Customize (the home page). Empty = StorePal's own order and its three built-in highlights.
  homeSections: { id: string; enabled: boolean }[];
  homeHighlights: { id: string; icon: string; title: string; text: string }[];
  homeHighlightsHeading: string | null;
  /** StorePal's buttons and labels: "en" or "bn" (themes/storepal/lib/storeText.ts). */
  storeLanguage?: 'en' | 'bn';
  /** Prices in Bangla digits while storeLanguage is "bn" (IDEA-7); missing = Latin digits. */
  storeBanglaDigits?: boolean;
  /** Store > Design > Chat Button — the floating bubble (see themes/storepal/components/ChatBubble.tsx). Missing = the bubble as it always was. */
  /** Share button on the product page (TellMe idea 61); missing = shown. */
  productShareEnabled?: boolean;
  /** "Compare" tick box on cards and the compare bar (IDEA-13); missing = off. */
  compareEnabled?: boolean;
  /** "N bought in the last X days" window (TellMe idea 63): 0 or missing = off. */
  socialProofDays?: number;
  /** Wishlist price / restock alerts by SMS (TellMe idea 62). */
  wishlistAlertsEnabled?: boolean;
  /** The store AI assistant's own name, picture, first message, ready questions, voice-call opening, voice speed and corner (null / [] = built-in). */
  aiAssistantName?: string | null;
  aiAssistantAvatarUrl?: string | null;
  aiChatGreeting?: string | null;
  aiChatStarters?: string[];
  aiVoiceGreeting?: string | null;
  aiVoiceSpeed?: 'SLOW' | 'NORMAL' | 'FAST';
  aiChatSide?: 'RIGHT' | 'LEFT';
  chatButtonEnabled?: boolean;
  chatButtonChannel?: 'WHATSAPP' | 'MESSENGER';
  /** Messenger only: https://m.me/<page>. */
  chatButtonMessengerLink?: string | null;
  chatButtonSide?: 'LEFT' | 'RIGHT';
  /** HOME = home and shop lists, PRODUCT = product pages, OTHER = cart, info pages, account... */
  chatButtonPages?: ('HOME' | 'PRODUCT' | 'OTHER')[];
  chatButtonProductMessage?: boolean;
}

export interface StorefrontCustomCode {
  customCss: string | null;
  // Raw HTML snippet for <head>.
  headScripts: string | null;
  // Plain JS, no <script> wrapper, in run order.
  headJs: { id: string; code: string }[];
  bodyJs: { id: string; code: string }[];
}

export interface StorefrontStockSettings {
  showOutOfStockProducts: boolean;
  showOutOfStockBadge: boolean;
  allowBackorder: boolean;
  backorderPopupMessage: string | null;
  backorderShortMessage: string | null;
  // "Only 3 left" message (Store > Stock Settings). Absent in an older cached response.
  lowStockMessageEnabled?: boolean;
  lowStockMessageLimit?: number;
  hideStockCount?: boolean;
  // Store-wide warranty and return policy for products that set none of their own.
  defaultWarrantyKind?: string | null;
  defaultWarrantyCustom?: string | null;
  defaultReturnDays?: number | null;
  defaultReturnCondition?: string | null;
}

/**
 * Marketing > Campaigns > Popup: one published popup, as the server sends it
 * (PopupCampaign minus the vendor's own fields and counters). The browser
 * works out whether to show it (themes/storepal/components/PopupCampaigns.tsx).
 * Mirrored by hand in client/src/lib/popupCampaignsApi.ts.
 */
export interface StorefrontPopupCampaign {
  id: string;
  format: 'DIALOG' | 'TOAST';
  imageUrl: string | null;
  imageAlt: string | null;
  imageShape: 'WIDE' | 'BANNER' | 'PHOTO' | 'STANDARD' | 'SQUARE' | 'PORTRAIT';
  /** The part of the picture to show, as 0..1 fractions of the whole picture. */
  imageCrop: { x: number; y: number; w: number; h: number } | null;
  headline: string;
  message: string;
  textPlacement: 'BELOW_IMAGE' | 'ON_IMAGE';
  align: 'LEFT' | 'CENTER' | 'RIGHT';
  headlineAlign: 'LEFT' | 'CENTER' | 'RIGHT' | null;
  messageAlign: 'LEFT' | 'CENTER' | 'RIGHT' | null;
  buttonAlign: 'LEFT' | 'CENTER' | 'RIGHT' | null;
  width: number;
  couponEnabled: boolean;
  couponCode: string | null;
  buttonEnabled: boolean;
  buttonText: string | null;
  buttonLink: string | null;
  buttonColor: string | null;
  buttonStyle: 'SOLID' | 'OUTLINE' | 'TEXT';
  backgroundColor: string | null;
  textColor: string | null;
  cornerRadius: number;
  overlayOpacity: number;
  toastCorner: 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  autoCloseSeconds: number | null;
  trigger: 'IMMEDIATE' | 'DELAY' | 'SCROLL' | 'EXIT_INTENT';
  triggerSeconds: number;
  triggerScrollPercent: number;
  pageScope: 'ALL' | 'HOME' | 'PRODUCT' | 'CART' | 'SPECIFIC';
  pagePaths: string[];
  audience: 'EVERYONE' | 'NEW' | 'RETURNING';
  devices: 'ALL' | 'DESKTOP' | 'MOBILE';
  frequency: 'ONCE_EVER' | 'ONCE_PER_SESSION' | 'ONCE_PER_DAY' | 'ONCE_PER_WEEK' | 'EVERY_PAGE';
  startsAt: string | null;
  endsAt: string | null;
}

export interface StorefrontGdprPrompt {
  message: string | null;
  position: 'BOTTOM' | 'TOP' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  backgroundColor: string;
  textColor: string;
}

export interface StorefrontVariationOption {
  id: string;
  name: string;
  values: string[];
  position: number;
}

export interface StorefrontVariant {
  id: string;
  optionValues: Record<string, string>;
  stock: number;
  listPrice?: string | null;
  discountPrice?: string | null;
}

// Per-value photo set for ONE variation option (e.g. every "Color" value
// gets its own photos) — set on Add/Edit Product's "Variation Photos"
// section. Not necessarily present for every option; only the option the
// vendor picked as "Photos by" has entries here.
export interface StorefrontVariationValuePhoto {
  optionName: string;
  optionValue: string;
  photoUrls: string[];
}

/** A size guide (Store > Product > Size Guides): a measurement table or one picture. StorePal shows it beside the Size choice. */
export interface StorefrontSizeGuide {
  id: string;
  name: string;
  kind: 'TABLE' | 'IMAGE';
  /** TABLE: the column headings and the rows of cells (each row as long as the headings). */
  columns: string[];
  rows: string[][];
  /** IMAGE: the chart picture. */
  imageUrl: string | null;
  note: string | null;
}

/** Colour circles on a product card (server storefront/card-swatches.ts); only on the product list answer. */
export interface StorefrontCardSwatches {
  option: string;
  items: Array<{ value: string; photoUrl: string | null }>;
}

/** A product video (YouTube, Facebook, Instagram, TikTok or an .mp4), as the server worked it out. */
export interface StorefrontProductVideo {
  platform: 'YOUTUBE' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'FILE';
  /** WIDE 16:9, TALL 9:16 (Shorts, TikTok, reels). */
  shape: 'WIDE' | 'TALL';
  /** The player to load on tap; null = a short link not worked out yet (show a plain link). */
  embedUrl: string | null;
  watchUrl: string;
  thumbUrl: string | null;
}

export interface StorefrontProduct {
  id: string;
  /** The store's own badge ("New", "Hot"); already empty once its end time has passed. StorePal shows it. */
  badgeText?: string | null;
  /** Hidden words that also find this product in StorePal's search (Product.searchKeywords); never shown. */
  searchKeywords?: string[];
  quantityStep?: number;
  unitLabel?: string | null;
  comingSoon?: boolean;
  comingSoonUntil?: string | null;
  /** The guide this product shows (its own, else its category's); null when none. Only the product page answer carries it. */
  sizeGuide?: StorefrontSizeGuide | null;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  secondaryCategories: string[];
  brand?: string | null;
  summary?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  photoSize: string;
  photoUrls: string[];
  videoUrl?: string | null;
  /** The product video ready to play (server products/product-video.ts); only on the full product answer. */
  video?: StorefrontProductVideo | null;
  /** Colour circles for the card; only on the product list answer. */
  swatches?: StorefrontCardSwatches | null;
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  /** Price on request (StorePal hides the price and Buy). Absent from older API responses. */
  quoteOnly?: boolean;
  /** Reseller system (RESELLER-plan.md Step 5): set on a product this store resells for a supplier, an opaque key per supplier. The cart keeps one supplier's products per order and nothing else. */
  resaleGroup?: string | null;
  /** Fewest a shopper may order in one cart line; null = no minimum. */
  minOrderQuantity?: number | null;
  /** Bundle / combo (TellMe idea 51): what the set holds and what the parts cost one by one. Its stock is the fewest sets they allow. */
  isBundle?: boolean;
  /** "Pick N" box (IDEA-22): the shopper picks this many pieces from `bundle.items`; null/absent = a fixed set. */
  bundlePick?: number | null;
  bundle?: {
    /** In a "pick N" box each item is a choice: `quantity` is the most one box may hold, and the rest says what the picker needs. */
    items: { name: string; quantity: number; productId?: string; photo?: string | null; price?: number; stock?: number | null }[];
    separateTotal: number;
    pick?: number | null;
  };
  /** Information asked from the shopper (TellMe idea 75): up to 3 boxes and a fee per piece when any is filled in. */
  customFields?: { id: string; label: string; required: boolean; maxLength: number }[] | null;
  customFee?: string | number | null;
  /** Quantity price breaks (TellMe idea 67): from minQty pieces each costs price. Absent or empty = none. */
  priceBreaks?: { minQty: number; price: number }[] | null;
  /** Pre-order expected date, YYYY-MM-DD (TellMe idea 64). */
  preOrderDate?: string | null;
  /** Expected restock day (YYYY-MM-DD, TellMe idea 114); only present while the product is sold out and the day has not passed. */
  restockDate?: string | null;
  /** Extra information tabs (TellMe idea 119): up to 3 of { title, text (cleaned HTML) }. */
  infoTabs?: { title: string; text: string }[] | null;
  /** Orders that bought it in the social-proof window (TellMe idea 63), counted nightly. */
  soldRecent?: number;
  /** Most pieces in one order (TellMe idea 56); null = no limit. The cart stops at it. */
  maxOrderQuantity?: number | null;
  /** Warranty and return policy (TellMe idea 54); null = the store default (stockSettings.default*). */
  warrantyKind?: string | null;
  warrantyCustom?: string | null;
  returnDays?: number | null;
  returnCondition?: string | null;
  /** When a running Flash Sale that is lowering this product's price ends (ISO); null/absent = no sale. */
  flashSaleEndsAt?: string | null;
  stockQuantity?: number | null;
  weight?: string | null;
  weightUnit: string;
  variationOptions: StorefrontVariationOption[];
  variants: StorefrontVariant[];
  // Optional: only present once the backend has the VariationValuePhoto
  // migration deployed. Older cached responses (Next.js ISR) or an
  // in-flight deploy can still omit this field — every consumer must
  // treat it as possibly undefined, not assume it's always an array.
  variationPhotos?: StorefrontVariationValuePhoto[];
  createdAt: string;
}

export interface StorefrontCategoryDetail {
  name: string;
  coverPhotoUrl: string | null;
  squarePhotoUrl: string | null;
  /** Real subcategories (Category.parentId) — powers StorePal's header dropdown (see StoreHeader.tsx). Optional: older cached responses may omit it. */
  children?: { name: string }[];
}

export interface StorefrontListData {
  store: StorefrontInfo;
  products: StorefrontProduct[];
  categories: string[];
  /** Store > Categories' own photos for the names in `categories`, when set — see StorePal's HomeView shortcut cards. */
  categoryDetails?: StorefrontCategoryDetail[];
  /** Only while the store has no public product: which setup cards are already done and where the dashboard is. Null/absent once a product exists. */
  setup?: StorefrontSetupGuide | null;
}

export interface StorefrontSetupGuide {
  /** The vendor dashboard's base URL (the server's CLIENT_URL); null when it isn't configured. */
  dashboardUrl: string | null;
  done: { design: boolean; payments: boolean; domain: boolean; shipping: boolean };
}

export interface StorefrontDetailData {
  store: StorefrontInfo;
  product: StorefrontProduct;
}

// Lean shape for the product detail page's sidebar — see
// getStoreSidebar/productCardSelect on the backend for why this is
// deliberately NOT the same as StorefrontProduct (no description,
// variationOptions, variationPhotos, etc — only what ProductCard reads).
export interface StorefrontCardProduct {
  id: string;
  /** The store's own badge ("New", "Hot"); StorePal shows it. */
  badgeText?: string | null;
  name: string;
  slug: string;
  category?: string | null;
  brand?: string | null;
  photoSize: string;
  photoUrls: string[];
  // For StorePal's Product Card Display Options (summary / hover video).
  summary?: string | null;
  videoUrl?: string | null;
  price: string;
  discountPrice?: string | null;
  isPreOrder: boolean;
  /** Price on request (StorePal hides the price and Buy). Absent from older API responses. */
  quoteOnly?: boolean;
  /** Fewest a shopper may order in one cart line; null = no minimum. */
  minOrderQuantity?: number | null;
  stockQuantity?: number | null;
  variants: { stock: number }[];
  createdAt: string;
}

export interface StorefrontSidebarData {
  categories: string[];
  /** Real subcategories per category name — see StorefrontCategoryDetail; powers StorePal's header dropdown on the product page too. */
  categoryDetails?: StorefrontCategoryDetail[];
  related: StorefrontCardProduct[];
}

// Store data changes whenever a vendor adds/edits a product, so a short
// time-based revalidation window keeps pages fast (served from cache most
// of the time) without going stale for long. Tune this per environment if
// needed — it's not meant to be a hard architectural constant.
const REVALIDATE_SECONDS = 60;

class StoreNotFoundError extends Error {
  constructor(subdomain: string) {
    super(`No store found for subdomain "${subdomain}"`);
    this.name = 'StoreNotFoundError';
  }
}

class ProductNotFoundError extends Error {
  constructor(slug: string) {
    super(`No product found for slug "${slug}"`);
    this.name = 'ProductNotFoundError';
  }
}

class CampaignNotFoundError extends Error {
  constructor(slug: string) {
    super(`No campaign found for slug "${slug}"`);
    this.name = 'CampaignNotFoundError';
  }
}

class StorePageNotFoundError extends Error {
  constructor(slug: string) {
    super(`No page found for slug "${slug}"`);
    this.name = 'StorePageNotFoundError';
  }
}

class StoreBlogPostNotFoundError extends Error {
  constructor(slug: string) {
    super(`No blog post found for slug "${slug}"`);
    this.name = 'StoreBlogPostNotFoundError';
  }
}

class LandingPageNotFoundError extends Error {
  constructor(slug: string) {
    super(`No landing page found for slug "${slug}"`);
    this.name = 'LandingPageNotFoundError';
  }
}

export {
  StoreNotFoundError,
  ProductNotFoundError,
  CampaignNotFoundError,
  StorePageNotFoundError,
  StoreBlogPostNotFoundError,
  LandingPageNotFoundError,
};

// Canonical absolute URL for a storefront path — used in generateMetadata
// (alternates.canonical, Open Graph og:url) and JSON-LD. A relative or
// wrong-host og:url makes link-preview crawlers (Facebook Messenger,
// WhatsApp, etc) silently drop the whole preview, including the image —
// so this must resolve to whatever host actually served the request:
// the vendor's Store > Domain custom domain, a {subdomain}.ROOT_DOMAIN
// host, or the bare IP path (/store/:subdomain) in local/LAN dev. Reads
// the real request Host header (see next/headers) rather than assuming
// ROOT_DOMAIN, since a custom domain never matches ROOT_DOMAIN at all
// (see middleware.ts's separate resolve-domain path for those).
export async function siteUrl(path: string, address?: StoreAddress | null): Promise<string> {
  // PERFORMANCE-PLAN.md Step 8: the address the shopper used comes from the internal path (lib/storeAddress.ts), passed in
  // by a route handler or remembered by storeParams() for this page render, so the page doesn't read the request and can be
  // kept by Next's cache. Only an unknown host (or a page that never called storeParams) still reads the request.
  const known = address !== undefined ? address : currentStoreAddress();
  let origin: string;
  let clean: boolean;
  if (known) {
    origin = known.origin;
    clean = known.clean;
  } else {
    // A host the middleware didn't recognise (`<sub>~d`) or a render that never called storeParams(). Reading the request
    // here (as before 2026-10-24) makes a kept store page dynamic at runtime, which Next answers with a 500 ("Page changed
    // from static to dynamic at runtime"), so name the store's own platform address instead: the address search engines
    // should index anyway. Without ROOT_DOMAIN (local dev) the path stays relative.
    const root = process.env.ROOT_DOMAIN?.trim();
    const segment = /^\/store\/([^/]+)/.exec(path)?.[1];
    if (!root || !segment) return path;
    origin = `https://${storeSubdomain(segment)}.${root}`;
    clean = true;
  }
  // A store reached on its own address ({sub}.ROOT_DOMAIN or a custom domain, marked by middleware.ts) has one clean public form of
  // every page: /product/x, never /store/{sub}/product/x. Pages build their paths in the long form, so cut the prefix off here;
  // that way canonical links, Open Graph URLs, JSON-LD and the sitemap all agree on a single address per page.
  const m = /^\/store\/([^/]+)(\/.*)?$/.exec(path);
  if (m && clean) {
    // The vendor may prefer their custom domain on every address the store answers on (Store > SEO).
    const store = await getStoreInfo(m[1]).catch(() => null);
    const base = store?.customDomain && store.seo?.preferCustomDomain ? `https://${store.customDomain}` : origin;
    return `${base}${m[2] ?? '/'}`;
  }
  return `${origin}${path}`;
}

/** Everything a search engine may index on this store (the sitemap's data). Null when the store does not exist. */
export async function getSitemapData(subdomain: string): Promise<StorefrontSitemapData | null> {
  return fetchJson<StorefrontSitemapData>(`/v1/store/${subdomain}/sitemap-data`, [`store:${subdomain}`]);
}


async function fetchJson<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Storefront API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  // PERFORMANCE-PLAN.md Step 9: Next's data cache does not keep an answer over 2 MB, so such a store's data is fetched
  // again on every page view. Say so in the log before a store gets there.
  const size = Number(res.headers.get('content-length') ?? 0);
  if (size > LARGE_ANSWER_BYTES) {
    console.warn(`[storefrontApi] ${path} answered ${(size / 1_048_576).toFixed(2)} MB; over 2 MB it is no longer cached.`);
  }
  return res.json() as Promise<T>;
}

const LARGE_ANSWER_BYTES = 1.5 * 1_048_576;

/**
 * One order by its private tracking-link token (tracking-plan.md Step 1), for
 * the /t/[token] page. Never cached: it is a single shopper's live order, and
 * the token must not end up in a shared cache key. Null for any miss (the API
 * answers every miss with the same 404) and for a blocked caller (429).
 * Server-only, like the rest of this file.
 */
export async function getTrackedOrderByLink(subdomain: string, token: string): Promise<TrackedOrder | null> {
  // This request comes from the storefront server, not the shopper's browser, so the API would see
  // one address for every visitor and its per-IP guard on wrong tokens (5 in 10 minutes) would lock
  // everyone out after a few mistyped links. Pass the visitor's address along (the reverse proxy
  // put it in X-Forwarded-For) so each visitor is judged on their own.
  const { headers } = await import('next/headers');
  const forwarded = (await headers()).get('x-forwarded-for');
  // open=1: this is the page's own first load, which the vendor's "opened" count includes (the
  // page's once-a-minute refresh from the browser does not send it).
  const res = await fetch(`${API_URL}/v1/store/${subdomain}/track/${encodeURIComponent(token)}?open=1`, {
    cache: 'no-store',
    headers: forwarded ? { 'x-forwarded-for': forwarded } : undefined,
  });
  if (res.status === 404 || res.status === 429) return null;
  if (!res.ok) throw new Error(`Storefront API request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<TrackedOrder>;
}

/**
 * The store's public product list. Pages get the lighter list answer (`?view=list`, PERFORMANCE-PLAN.md Step 9: no long
 * description, info tabs, SEO texts, variation photos, personalization or price-break fields, which only the product page
 * shows and which it reads from its own call). `full: true` is for the one reader that needs them (the Facebook feed).
 */
export async function getStoreProducts(subdomain: string, options: { full?: boolean } = {}): Promise<StorefrontListData> {
  const path = options.full ? `/v1/store/${subdomain}/products` : `/v1/store/${subdomain}/products?view=list`;
  const data = await fetchJson<StorefrontListData>(path, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

// Lean vendor-only lookup (id/storeName/subdomain/theme) — no products,
// no categories. Used wherever a route only needs to know which theme
// to render with (see the store/[subdomain] layout) rather than the
// full catalog getStoreProducts fetches. Next.js's fetch cache
// deduplicates this against any other call to the same URL within the
// same render pass, so a page that also calls getStoreProducts (which
// hits a different URL) still only pays for one extra lightweight
// request, not a duplicate of its own full-catalog fetch.
export async function getStoreInfo(subdomain: string): Promise<StorefrontInfo> {
  const data = await fetchJson<StorefrontInfo>(`/v1/store/${subdomain}`, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

export interface StorefrontReview {
  id: string;
  title: string;
  content: string | null;
  rating: number;
  photos: string[];
  customerName: string | null;
  featured: boolean;
  createdAt: string;
}

// Homepage "Customer Reviews" section — falls back to an empty array
// rather than throwing, same reasoning as getStoreSidebar below: this
// is decorative content, a hiccup here shouldn't ever break the whole
// homepage from rendering.
export async function getStoreReviews(subdomain: string): Promise<StorefrontReview[]> {
  try {
    const data = await fetchJson<StorefrontReview[]>(`/v1/store/${subdomain}/reviews`, [`store:${subdomain}`]);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getStoreProduct(subdomain: string, slug: string): Promise<StorefrontDetailData> {
  const data = await fetchJson<StorefrontDetailData>(`/v1/store/${subdomain}/products/${slug}`, [
    `store:${subdomain}`,
    `store:${subdomain}:product:${slug}`,
  ]);
  if (!data) throw new ProductNotFoundError(slug);
  return data;
}

export interface StorefrontCampaignData {
  store: StorefrontInfo;
  campaign: { id: string; name: string; coverPhotoUrl: string | null };
  products: StorefrontProduct[];
  categories: string[];
}

// Marketing > Campaigns' public landing page (Medium theme only — see
// themes/medium/views/CampaignView.tsx). Same tag shape as
// getStoreProduct so a product/campaign change still revalidates
// correctly (see StorefrontRevalidateService on the backend).
export async function getStoreCampaign(subdomain: string, slug: string): Promise<StorefrontCampaignData> {
  const data = await fetchJson<StorefrontCampaignData>(`/v1/store/${subdomain}/campaigns/${slug}`, [
    `store:${subdomain}`,
  ]);
  if (!data) throw new CampaignNotFoundError(slug);
  return data;
}

export interface StorefrontCollectionData {
  store: StorefrontInfo;
  collection: { id: string; name: string; coverPhotoUrl: string | null; content: string | null };
  products: StorefrontProduct[];
  categories: string[];
}

class CollectionNotFoundError extends Error {
  constructor(slug: string) {
    super(`No collection found for slug "${slug}"`);
    this.name = 'CollectionNotFoundError';
  }
}
export { CollectionNotFoundError };

// A collection's public page (TellMe idea 72): hand-picked or rule-based, StorePal only.
export async function getStoreCollection(subdomain: string, slug: string): Promise<StorefrontCollectionData> {
  const data = await fetchJson<StorefrontCollectionData>(`/v1/store/${subdomain}/collections/${slug}`, [`store:${subdomain}`]);
  if (!data) throw new CollectionNotFoundError(slug);
  return data;
}

export interface StorefrontCampaignSummary {
  id: string;
  name: string;
  slug: string;
  coverPhotoUrl: string | null;
}

// Campaign list with cover photos — powers the StorePal theme's
// homepage hero banner (see themes/storepal/views/HomeView.tsx). Falls
// back to an empty array rather than throwing — a store with no
// campaigns yet (or a hiccup fetching them) just means no hero banner,
// not a broken homepage.
export async function getStoreCampaigns(subdomain: string): Promise<StorefrontCampaignSummary[]> {
  try {
    const data = await fetchJson<StorefrontCampaignSummary[]>(`/v1/store/${subdomain}/campaigns`, [
      `store:${subdomain}`,
    ]);
    return data ?? [];
  } catch {
    return [];
  }
}

// -- Landing Pages (landing-plan.md §6, §8) ------------------------------
// Kept in lockstep by hand with client/src/lib/landingPagesApi.ts's own
// LandingPageSection shape and landing-page-sections.md's registry — same
// convention this file's own header comment already documents for every
// other type here.

export interface StorefrontLandingPageSection {
  id: string;
  type: string;
  props: Record<string, unknown>;
  visibility: { desktop: boolean; mobile: boolean };
}

export type StorefrontLandingPageDisplayMode = 'FULL_PAGE' | 'WITH_STORE_CHROME';

export interface StorefrontLandingPage {
  id: string;
  title: string;
  slug: string;
  sections: StorefrontLandingPageSection[];
  displayMode: StorefrontLandingPageDisplayMode;
  chatButtonEnabled: boolean;
  chatButtonLink?: string | null;
  chatButtonImageUrl?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  customCss?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  coverImageUrl?: string | null;
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
}

// Resolved product data for every productId/productIds referenced
// anywhere in this page's sections (Select Products, Price Offer, Sticky
// Order Bar) — see StorefrontService.getStoreLandingPage's own comment on
// the backend for why this is batched server-side rather than the render
// tree fetching product-by-product. A productId with no matching entry
// here (deleted, or since made non-PUBLIC) should render as "not
// selected", not an error — see landing-page-sections.md §3.1's render note.
export interface StorefrontLandingPageProduct {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  price: string;
  discountPrice: string | null;
  stockQuantity: number | null;
  isPreOrder: boolean;
  inStock: boolean;
  minOrderQuantity?: number | null;
  /** Size, Colour...: the landing checkout asks for each. Missing on an older server answer = none. */
  options?: { name: string; values: string[] }[];
  /** The option combinations that are sold out. */
  soldOut?: Record<string, string>[];
}

export interface StorefrontLandingPageData {
  store: StorefrontInfo;
  landingPage: StorefrontLandingPage;
  products: StorefrontLandingPageProduct[];
}

/**
 * Store > Landing Pages' public rendering (landing-plan.md §6, §8). Only
 * ever returns a PUBLISHED page — see StorefrontService.getStoreLandingPage
 * on the backend. Tagged separately from the product-list tag (`:landing:`
 * not `:product:`) so StorefrontRevalidateService's 'landing-page' kind
 * revalidates exactly this cache entry.
 */
export async function getStoreLandingPage(subdomain: string, slug: string): Promise<StorefrontLandingPageData> {
  const data = await fetchJson<StorefrontLandingPageData>(
    `/v1/store/${subdomain}/landing-pages/${encodeURIComponent(slug)}`,
    [`store:${subdomain}`, `store:${subdomain}:landing:${slug}`],
  );
  if (!data) throw new LandingPageNotFoundError(slug);
  return data;
}

// Category strip + related products for the product detail page's
// sidebar — deliberately lean (see StorefrontSidebarData/
// productCardSelect on the backend) instead of reusing getStoreProducts,
// which would fetch the vendor's ENTIRE catalog with every relation just
// to show 4 cards. Falls back to an empty result rather than throwing —
// this is decorative sidebar content, so a hiccup here shouldn't ever
// take down the whole product page (see the product page's .catch()).
export async function getStoreSidebar(
  subdomain: string,
  slug: string,
  category?: string | null,
): Promise<StorefrontSidebarData> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const data = await fetchJson<StorefrontSidebarData>(
    `/v1/store/${subdomain}/products/${slug}/sidebar${query}`,
    [`store:${subdomain}`],
  );
  return data ?? { categories: [], related: [] };
}

export interface StorefrontPage {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  updatedAt: string;
}

export interface StorefrontPageData {
  store: StorefrontInfo;
  page: StorefrontPage;
}

// Store > Pages' public rendering (About Us, Contact Us, Privacy
// Policy, etc — see reference screenshot at
// storepal.com.bd/page/about-us). Only ever a PUBLISHED page — see
// StorefrontService.getStorePage on the backend.
/** The store's published pages (title + slug), cached with the store; an empty list if the call fails. Used for the demo pages. */
export async function getStorePageList(subdomain: string): Promise<Array<{ slug: string; title: string }>> {
  const data = await fetchJson<Array<{ slug: string; title: string }>>(`/v1/store/${subdomain}/pages`, [`store:${subdomain}`]).catch(() => null);
  return Array.isArray(data) ? data : [];
}

export async function getStorePage(subdomain: string, slug: string): Promise<StorefrontPageData> {
  const data = await fetchJson<StorefrontPageData>(`/v1/store/${subdomain}/pages/${slug}`, [
    `store:${subdomain}`,
  ]);
  if (!data) throw new StorePageNotFoundError(slug);
  return data;
}

/** Store > Magazine (TellMe idea 106, StorePal only). */
export interface StorefrontBlogCard {
  title: string;
  slug: string;
  coverUrl: string | null;
  excerpt: string | null;
  authorName: string | null;
  publishedAt: string;
}
export interface StorefrontBlogPost extends StorefrontBlogCard {
  content: string | null;
  tags: string[];
}

/** The latest posts (empty on any store that is not StorePal, or with no post yet). */
export async function getStoreBlog(subdomain: string, limit?: number): Promise<{ store: StorefrontInfo; posts: StorefrontBlogCard[]; total: number }> {
  const data = await fetchJson<{ store: StorefrontInfo; posts: StorefrontBlogCard[]; total: number }>(`/v1/store/${subdomain}/blog${limit ? `?limit=${limit}` : ''}`, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

/** One post and the other latest ones; throws StoreBlogPostNotFoundError for a draft, a scheduled post or another theme. */
export async function getStoreBlogPost(
  subdomain: string,
  slug: string,
): Promise<{ store: StorefrontInfo; post: StorefrontBlogPost; others: Array<Pick<StorefrontBlogCard, 'title' | 'slug' | 'coverUrl' | 'publishedAt'>> }> {
  const data = await fetchJson<{ store: StorefrontInfo; post: StorefrontBlogPost; others: Array<Pick<StorefrontBlogCard, 'title' | 'slug' | 'coverUrl' | 'publishedAt'>> }>(
    `/v1/store/${subdomain}/blog/${slug}`,
    [`store:${subdomain}`],
  );
  if (!data) throw new StoreBlogPostNotFoundError(slug);
  return data;
}

/** Store FAQ (TellMe idea 122, StorePal only): the questions switched on, in the owner's order; empty on any other theme. */
export interface StorefrontFaqItem {
  id: string;
  question: string;
  answer: string;
}
export async function getStoreFaq(subdomain: string): Promise<{ store: StorefrontInfo; items: StorefrontFaqItem[] }> {
  const data = await fetchJson<{ store: StorefrontInfo; items: StorefrontFaqItem[] }>(`/v1/store/${subdomain}/faq`, [`store:${subdomain}`]);
  if (!data) throw new StoreNotFoundError(subdomain);
  return data;
}

/** One of the store's shops (server shop-locations/). The links are Google's own, ready to open. */
export interface StoreShopLocation {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  openUrl: string;
  directionsUrl: string;
  lat: number | null;
  lon: number | null;
}

/** The store's shops for its "Our shops" page; an empty list when none are set. Every template. */
export async function getStoreLocations(subdomain: string): Promise<StoreShopLocation[]> {
  const data = await fetchJson<{ items: StoreShopLocation[] }>(`/v1/store/${subdomain}/locations`, [`store:${subdomain}`]);
  return data?.items ?? [];
}

/** Social Feed (SOCIAL-FEED-plan.md, StorePal only): the store's YouTube channel and its newest videos; `feed` is null while off or empty. */
export interface StorefrontSocialPost {
  id: string;
  platform: 'YOUTUBE';
  videoId: string;
  title: string;
  thumbUrl: string;
  permalink: string;
  postedAt: string;
}
export interface StorefrontSocialFeed {
  title: string | null;
  columns: number;
  rows: number;
  showHeader: boolean;
  account: {
    platform: 'YOUTUBE';
    title: string;
    handle: string | null;
    avatarUrl: string | null;
    profileUrl: string;
    followers: number | null;
    postsCount: number | null;
  };
  posts: StorefrontSocialPost[];
}
export async function getStoreSocialFeed(subdomain: string): Promise<StorefrontSocialFeed | null> {
  const data = await fetchJson<{ feed: StorefrontSocialFeed | null }>(`/v1/store/${subdomain}/social-feed`, [`store:${subdomain}`]);
  return data?.feed ?? null;
}

/** "Notify me" on a coming-soon product (TellMe idea 104): the phone joins the waitlist. */
export async function joinProductWaitlist(subdomain: string, slug: string, phone: string, name?: string, kind: 'COMING' | 'RESTOCK' = 'COMING'): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? `${window.location.protocol}//${window.location.hostname}:4000`;
  const res = await fetch(`${origin}/v1/store/${encodeURIComponent(subdomain)}/products/${encodeURIComponent(slug)}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, name: name?.trim() || undefined, kind }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || 'Could not save your number. Please try again.');
  }
}

export type StoreReportReason = 'FAKE_PRODUCTS' | 'NOT_DELIVERED' | 'SCAM' | 'ABUSE' | 'OTHER';

/** "Report this store" (super-admin-plan.md Step 17): sent from the browser, no account. The server limits it to one report per store per day per address. */
export async function submitStoreReport(subdomain: string, body: { reason: StoreReportReason; note?: string; phone?: string }): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? `${window.location.protocol}//${window.location.hostname}:4000`;
  const res = await fetch(`${origin}/v1/store/${encodeURIComponent(subdomain)}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(message || 'Could not send your report. Please try again.');
  }
}

export interface StoreContactPage {
  enabled: boolean;
  intro: string;
  whatsapp: { label: string; url: string } | null;
  phone: { label: string; url: string } | null;
  basedIn: string | null;
}

/** The StorePal /contact page's cards and intro (cached with the other store pages; the store's save revalidates it). */
export async function getStoreContact(subdomain: string): Promise<StoreContactPage | null> {
  return fetchJson<StoreContactPage>(`/v1/store/${subdomain}/contact`, [`store:${subdomain}`]);
}

/** A shopper's message from the /contact page, sent from the browser (no account). */
export async function sendContactMessage(subdomain: string, body: { name: string; phone: string; email?: string; message: string }): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? `${window.location.protocol}//${window.location.hostname}:4000`;
  const res = await fetch(`${origin}/v1/store/${encodeURIComponent(subdomain)}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(message || 'Could not send your message. Please try again.');
  }
}
