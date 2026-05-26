import type { NextConfig } from "next";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002/api";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // API calls proxied through Pages Function (functions/api/[[path]].ts)
};

export default nextConfig;