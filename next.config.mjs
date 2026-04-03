/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows / slow FS / cloud-sync folders: more reliable dev rebuilds (helps ChunkLoadError on layout)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
