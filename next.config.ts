import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Produces a minimal self-contained .next/standalone build (only the
  // files actually needed at runtime) so the Docker image stays small —
  // see storefront/Dockerfile.
  output: 'standalone',
  // Security F-56: don't advertise the framework, and send the standard safety headers on every page. HSTS without
  // includeSubDomains, since a custom domain's own other subdomains are the store owner's business.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=15552000' },
        ],
      },
    ];
  },
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
