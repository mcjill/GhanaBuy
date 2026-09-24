/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
