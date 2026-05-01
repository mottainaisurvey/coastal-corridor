/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Cesium is loaded via CDN and has no TS declarations — ignore type errors at build time
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'basemaps.cartocdn.com' }
    ]
  }
};

module.exports = nextConfig;
