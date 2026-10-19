import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses (gzip/brotli) at the Next.js layer
  compress: true,

  // Partial prefetching: prefetch only the RSC payload for visible links
  // (Next 15+ feature — keeps data fresh without over-fetching)
  partialPrefetching: true,

  // Cache component renders
  cacheComponents: true,
};

export default nextConfig;
