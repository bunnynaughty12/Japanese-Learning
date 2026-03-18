import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Chỉ định đúng thư mục root của project
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
