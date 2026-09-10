import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Product photos are uploaded to Cloudinary by the vendor dashboard
    // (see server/src/upload/cloudinary.service.ts) — allow-list its
    // delivery host so next/image can optimize them.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
