/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
