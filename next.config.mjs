import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  // Phones on the LAN load the dev server by IP; list that origin so Next serves
  // /_next/* and the HMR socket to it (it warns about cross-origin dev requests
  // otherwise). Extra origins can be added with DEV_ORIGINS="a,b".
  allowedDevOrigins: ['192.168.1.151', ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(',') : [])],
  pageExtensions: ['tsx', 'ts'],
  eslint: {
    // Exclude tictactoe folder from linting during builds
    ignoreDuringBuilds: false,
    dirs: ['src/pages', 'src/projects/ai-confidence-tracker', 'src/projects/receipt-scanner', 'src/projects/dictate', 'src/projects/reading-practice', 'src/projects/clipperstream']
  },
  webpack: (config) => {
    // Relative to this file, not the process's working folder (a server started
    // from another checkout would otherwise resolve modules from that checkout's src).
    config.resolve.modules.push(path.resolve(import.meta.dirname, 'src'));
    return config;
  }
};

export default nextConfig; 