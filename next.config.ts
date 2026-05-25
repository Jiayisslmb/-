import type { NextConfig } from "next";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // rewrites not supported with static export; API calls run client-side
};

export default nextConfig;