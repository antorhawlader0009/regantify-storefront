import { redirect } from 'next/navigation';
import { storeParams } from '@/lib/storeRequest';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

// The wishlist opens inside the My account dialog now (2026-10-29, the owner's request); old links land there.
export default async function WishlistPage({ params }: PageProps) {
  const { subdomain } = await storeParams(params);
  redirect(`/store/${subdomain}/account/wishlist`);
}
