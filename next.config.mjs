/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdf-parse / pdf.js in Node (avoid broken webpack bundles of native-ish deps)
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  // Windows / slow FS / cloud-sync folders: more reliable dev rebuilds (helps ChunkLoadError on layout)
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      // Do not bundle PDF engines (breaks pdf-parse debug guard; pdfjs-dist is huge and needs real files).
      if (Array.isArray(config.externals)) {
        config.externals.push({ "pdf-parse": "commonjs pdf-parse" });
        config.externals.push(/^pdfjs-dist\//);
      }
    }
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
