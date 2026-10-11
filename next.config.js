/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
  },
  // Security headers (CSP etc.) live in public/_headers. `headers()` is ignored
  // by `output: "export"`, so a second copy here would only drift.
};

module.exports = nextConfig;
