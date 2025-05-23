import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fisco-post-images.s3.us-west-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
