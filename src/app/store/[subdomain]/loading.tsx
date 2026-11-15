import { StoreHomeSkeleton } from '@/components/StoreSkeletons';

// Shown while a store page is on its way (home, category, search, and any page without its own loading screen).
export default function Loading() {
  return <StoreHomeSkeleton />;
}
