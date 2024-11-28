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
  output: "standalone",
};

export default nextConfig;
