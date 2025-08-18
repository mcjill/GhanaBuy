/** @type {import('next').NextConfig} */
// Only use a base path when building for GitHub Pages. Vercel sets the
// `VERCEL` environment variable during builds, so we can detect that and avoid
// prefixing all routes (which would otherwise cause 404s on Vercel).
const basePath = process.env.VERCEL
  ? ''
  : process.env.NODE_ENV === 'production'
    ? '/Can-I-Buy'
    : '';

const nextConfig = {
  // Remove output: 'export' to enable API routes
  basePath,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    domains: [
      'jumia.is',
      'jumia.com.gh',
      'compughana.com',
      'telefonika.com',
      'gh.jumia.is',
      'cdn.pixabay.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'jiji.com.gh',
      'pictures-ghana.jiji.ng',
      'static-gh.jiji.ng',
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Add webpack configurations if needed
    return config;
  },
  headers: () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
