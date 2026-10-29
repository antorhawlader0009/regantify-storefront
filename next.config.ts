import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Produces a minimal self-contained .next/standalone build (only the
  // files actually needed at runtime) so the Docker image stays small -
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
    // An optimized photo is kept 4 hours. Photos come from R2 with a fixed name per size (src/lib/imageLoader.ts), so a replaced
    // picture (store logo) gets a new address (?v=) and is never served stale.
    minimumCacheTTL: 14400,
    // Photos are saved in R2 in a few widths, not resized by this server (src/lib/imageLoader.ts). The widths below are the ones
    // next/image asks for; each is rounded up to the nearest saved width.
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [48, 96, 128, 256, 384],
  },
};

export default nextConfig;
