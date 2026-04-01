import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    localPatterns: [
      {
        pathname: "/**",  // Matches any local path
        // No search key = allows any query string
      },
    ],
  },
};

export default nextConfig;