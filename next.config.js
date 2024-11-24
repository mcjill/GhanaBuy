/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
      'media.jiji.ng',
      'pictures.jiji.ng'
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  webpack: (config, { dev, isServer }) => {
    // Add polyfills for fetch in production
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  }
};

module.exports = nextConfig;
