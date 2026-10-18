import { Suspense } from 'react';
import { ConnectFlow } from '@/regantify/ConnectFlow';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <ConnectFlow mode="start" />
    </Suspense>
  );
}
