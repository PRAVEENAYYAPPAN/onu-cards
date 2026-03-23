import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Turbopack (Next.js 16 default dev server)
  turbopack: {},

  // Webpack (used for production builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bufferutil: false,
        "utf-8-validate": false,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
