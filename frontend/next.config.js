/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config,options) => {
    // Solve compiling problem via vagrant
    config.watchOptions = {
      poll: 1000,   // Check for changes every second
      aggregateTimeout: 300,   // delay before rebuilding
      ignored: ['**/node_modules','**/.git','**/.next'],
    };
    return config;
  }
}

module.exports = nextConfig
