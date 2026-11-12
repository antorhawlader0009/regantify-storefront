import type { ReactNode, SVGProps } from 'react';

// Techzone template icons (templete/techzone/components/Icons.tsx), plain SVG.

type P = SVGProps<SVGSVGElement>;
const Base = ({ children, ...p }: P & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const SearchIcon = (p: P) => <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>;
export const HeartIcon = (p: P) => <Base {...p}><path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9C20.5 15 12 20.5 12 20.5Z" /></Base>;
export const BagIcon = (p: P) => <Base {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Base>;
export const UserIcon = (p: P) => <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></Base>;
export const MenuIcon = (p: P) => <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>;
export const CloseIcon = (p: P) => <Base {...p}><path d="m6 6 12 12M18 6 6 18" /></Base>;
export const ArrowRight = (p: P) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const TruckIcon = (p: P) => <Base {...p}><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></Base>;
export const ReturnIcon = (p: P) => <Base {...p}><path d="M4 12a8 8 0 1 0 3-6.2" /><path d="M4 4v5h5" /></Base>;
export const LockIcon = (p: P) => <Base {...p}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1" /></Base>;
export const MedalIcon = (p: P) => <Base {...p}><circle cx="12" cy="9" r="5" /><path d="m9 13-2 8 5-3 5 3-2-8" /></Base>;
export const HeadsetIcon = (p: P) => <Base {...p}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.5-2 2-5 2" /></Base>;
export const MailIcon = (p: P) => <Base {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 6 9-6" /></Base>;
export const ShieldIcon = (p: P) => <Base {...p}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Base>;
export const TagIcon = (p: P) => <Base {...p}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="8.5" r="1.2" /></Base>;
export const ShoeIcon = (p: P) => <Base {...p}><path d="M2 16c0-2 1-3 3-3l3-1 2-4 3 1c1 2 3 3 6 3.5 2 .5 3 1.5 3 3.5v1H2v-1Z" /></Base>;
export const PlusIcon = (p: P) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>;
export const MinusIcon = (p: P) => <Base {...p}><path d="M5 12h14" /></Base>;
export const TrashIcon = (p: P) => <Base {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Base>;
export const FacebookIcon = (p: P) => <Base {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" /></Base>;
export const InstagramIcon = (p: P) => <Base {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></Base>;
export const PinterestIcon = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M11 8c3-1 5 1 4 3.5s-3 2-3.5 1M11.5 12.5 10 19" /></Base>;
export const TiktokIcon = (p: P) => <Base {...p}><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2 4 5 4" /></Base>;
export const YoutubeIcon = (p: P) => <Base {...p}><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5v-5Z" fill="currentColor" /></Base>;
export const ChevronLeft = (p: P) => <Base {...p}><path d="m15 5-7 7 7 7" /></Base>;
export const ChevronRight = (p: P) => <Base {...p}><path d="m9 5 7 7-7 7" /></Base>;
export const CheckIcon = (p: P) => <Base {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Base>;
export const SlidersIcon = (p: P) => <Base {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Base>;
