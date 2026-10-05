import {
  BadgeCheck,
  Clock,
  Gift,
  HandCoins,
  Headset,
  Heart,
  Leaf,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from 'lucide-react';

/**
 * The icons a store highlight (Store > Design > Customize) can use, by the key
 * the dashboard saves. Mirrors the server's HOME_HIGHLIGHT_ICONS and the
 * dashboard's client/src/lib/highlightIcons.ts. An unknown key (an icon added
 * later and not shipped here yet) falls back to Sparkles rather than breaking.
 */
const ICONS: Record<string, LucideIcon> = {
  TRUCK: Truck,
  SHIELD_CHECK: ShieldCheck,
  HAND_COINS: HandCoins,
  ROTATE_CCW: RotateCcw,
  HEADSET: Headset,
  BADGE_CHECK: BadgeCheck,
  CLOCK: Clock,
  GIFT: Gift,
  LEAF: Leaf,
  LOCK: Lock,
  STAR: Star,
  TAG: Tag,
  PACKAGE: Package,
  MAP_PIN: MapPin,
  HEART: Heart,
  SPARKLES: Sparkles,
};

export function highlightIcon(key: string): LucideIcon {
  return ICONS[key] ?? Sparkles;
}
