/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  images: {
    domains: [
      'www.tapback.co',
      'pictures-ghana.jijistatic.net',
      'gh.jumia.is',
      'compughana.com',
      'telefonika.com',
      'images-na.ssl-images-amazon.com',
      'www.compughana.com',
      'm.media-amazon.com',
      'media.compughana.com',
      'cdn.telefonika.com',
      'www.jumia.com.gh',
      'jumia.com.gh',
      'img.jumia.is',
      'static.jumia.com.gh',
      'telefonika.com.gh',
      'www.telefonika.com.gh',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
