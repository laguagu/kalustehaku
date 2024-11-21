import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tavaratrading.com",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
