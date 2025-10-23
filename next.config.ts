import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for serverless deployment
  output: 'standalone',
  // External packages for server components
  serverExternalPackages: ['ably'],
  // Add environment variables for client-side access
  env: {
    NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY,
  },
};

export default nextConfig;
