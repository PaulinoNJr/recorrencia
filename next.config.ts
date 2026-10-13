import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development badge from covering controls during participant tests.
  devIndicators: false,
};

export default nextConfig;
