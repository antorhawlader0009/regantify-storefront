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
    // PERFORMANCE-PLAN.md Step 3: an optimized photo is kept 4 hours instead of Next 15's 60 seconds, so the VPS
    // doesn't resize the same photo again every minute. Cloudinary's secure_url carries a version (v123...), so a
    // replaced photo gets a new address and is never served stale. (/_next/static is already "immutable" by default.)
    minimumCacheTTL: 14400,
    // PERFORMANCE-PLAN.md Step 10: photos are resized by Cloudinary, not by this server (src/lib/cloudinaryLoader.ts).
    // Fewer width steps than Next's default, so each photo makes fewer resized copies on Cloudinary (each new one uses a
    // little of the account's monthly transformation allowance); the browser still picks the nearest one.
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts',
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [48, 96, 128, 256, 384],
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
