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
  },
  // ---------------------------------------------------------------------------
  // Subdomain routing: rewrite subdomain root (/) to the correct internal path
  // This runs at the framework level, before middleware, so it's fully reliable.
  // ---------------------------------------------------------------------------
  async rewrites() {
    return {
      beforeFiles: [
        // admin.coastalcorridor.africa → /admin/sign-in
        {
          source: '/',
          destination: '/admin/sign-in',
          has: [{ type: 'host', value: 'admin.coastalcorridor.africa' }],
        },
        // agent.coastalcorridor.africa → /agent
        {
          source: '/',
          destination: '/agent',
          has: [{ type: 'host', value: 'agent.coastalcorridor.africa' }],
        },
        // developer.coastalcorridor.africa → /developer/sign-up
        {
          source: '/',
          destination: '/developer/sign-up',
          has: [{ type: 'host', value: 'developer.coastalcorridor.africa' }],
        },
        // map.coastalcorridor.africa → /map
        {
          source: '/',
          destination: '/map',
          has: [{ type: 'host', value: 'map.coastalcorridor.africa' }],
        },
        // operator.coastalcorridor.africa → /operator/sign-in
        {
          source: '/',
          destination: '/operator/sign-in',
          has: [{ type: 'host', value: 'operator.coastalcorridor.africa' }],
        },
        // host.coastalcorridor.africa → /host/sign-in
        {
          source: '/',
          destination: '/host/sign-in',
          has: [{ type: 'host', value: 'host.coastalcorridor.africa' }],
        },
      ],
    };
  },
};

module.exports = nextConfig;
