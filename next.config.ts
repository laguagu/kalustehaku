import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tavaratrading.com",
      },
      {
        protocol: "https",
        hostname: "offistore.fi",
      },
    ],
  },
  // Indicate that these packages should not be bundled by webpack
  // serverExternalPackages: ["onnxruntime-node"],
  output: "standalone",
};

export default nextConfig;
