import type { NextConfig } from 'next';

const configuredImageHosts = [
  process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
  process.env.NEXT_PUBLIC_IMAGE_CDN_HOST
]
  .map((host) => host?.trim())
  .filter((host): host is string => Boolean(host))
  .map((host) => {
    try {
      return new URL(host).hostname;
    } catch {
      return host;
    }
  });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net'
      },
      ...configuredImageHosts.map((hostname) => ({
        protocol: 'https' as const,
        hostname
      }))
    ]
  }
};

export default nextConfig;
