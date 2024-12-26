/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to enable API routes
  basePath: process.env.NODE_ENV === 'production' ? '/Can-I-Buy' : '',
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
