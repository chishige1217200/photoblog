import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://images.microcms-assets.io/assets/**")],
  },
};

export default nextConfig;
