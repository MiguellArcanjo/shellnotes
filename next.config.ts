import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Next.js scoped to this app when another lockfile exists higher in the
  // Windows user directory. Without this, Turbopack tries to scan C:\Users.
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
