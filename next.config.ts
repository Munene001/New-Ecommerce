import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    localPatterns: [
      { 
        pathname: "/**" 
      }
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.paziatech.co.ke",
      },
      {
        protocol: "https",
        hostname: "paziatech.co.ke",
      },
    ],
  },
};

export default nextConfig;