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
      'static-gh.jiji.ng'
    ],
    unoptimized: true
  },
  experimental: {
    serverActions: true
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      dns: false,
      tls: false,
      fs: false,
      path: false
    }
    return config
  }
}

module.exports = nextConfig
