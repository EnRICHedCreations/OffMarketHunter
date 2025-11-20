import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.realtor.com',
      },
      {
        protocol: 'https',
        hostname: '**.rdc.com',
      },
      {
        protocol: 'https',
        hostname: '**.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'ap.rdcpix.com',
      },
      {
        protocol: 'https',
        hostname: '**.rdcpix.com',
      },
    ],
  },
  // Ensure API routes are included in deployment
  outputFileTracingIncludes: {
    '/api/**/*': ['./app/api/**/*'],
  },
};

export default nextConfig;
