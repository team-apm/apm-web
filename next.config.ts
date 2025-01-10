import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out/apm-web',
  basePath: '/apm-web',
  webpack: (config) => {
    config.module.rules.push({
      test: /worker-bundle\.js$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
