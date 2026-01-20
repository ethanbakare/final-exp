import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Hide Next.js development indicators
  devIndicators: {
    appIsrStatus: false,      // Hides the Static Route Indicator ("N" badge)
    buildActivity: false,     // Hides the build activity spinner
  },
};

export default nextConfig;
