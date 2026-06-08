import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paziatech.co.ke";

const nextConfig: NextConfig = {
  reactCompiler: true,
  assetPrefix: isProd ? appUrl : undefined,
  images: {
    localPatterns: [{ pathname: "/**" }],
  },
};

export default nextConfig;