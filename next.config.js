/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // This is essential for static export
  images: {
    unoptimized: true, // Recommended for static export on Pages if not using Cloudflare Images
  },
  // any other configurations you have
};

module.exports = nextConfig;
