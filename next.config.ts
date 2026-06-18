import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: '.next-prod',
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
