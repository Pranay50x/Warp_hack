import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (if needed)
    ignoreBuildErrors: true,
  },
  // Add other config options here if needed
};

export default nextConfig;
