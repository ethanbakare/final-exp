import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  webpack: (config) => {
    config.resolve.modules.push(path.resolve('./src'));
    return config;
  }
};

export default nextConfig; 