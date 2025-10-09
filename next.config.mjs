import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  eslint: {
    // Exclude tictactoe folder from linting during builds
    ignoreDuringBuilds: false,
    dirs: ['src/pages', 'src/projects/ai-confidence-tracker', 'src/projects/receipt-scanner', 'src/projects/dictate', 'src/projects/reading-practice']
  },
  webpack: (config) => {
    config.resolve.modules.push(path.resolve('./src'));
    return config;
  }
};

export default nextConfig; 