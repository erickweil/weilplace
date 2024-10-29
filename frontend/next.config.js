/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  assetPrefix: process.env.ASSET_PREFIX || undefined,
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

// Testes apenas
if(process.env.NODE_ENV === "development") {
  nextConfig.rewrites = async () => {
    return {
      fallback: [
        {
          source: "/backend/:path*",
          destination: `${process.env.SERVERSIDE_API_URL}/:path*`,
        },
      ],
    };
  };
}

module.exports = nextConfig
