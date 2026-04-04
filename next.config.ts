import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Ensure Prisma works correctly in serverless environments
  serverExternalPackages: ['@prisma/client'],
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'طمنّي',
  },
};

export default nextConfig;
