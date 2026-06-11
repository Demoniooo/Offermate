import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 把 Turbopack 的工作区根锁定到本项目目录，
  // 避免它被上层目录里的 package-lock.json 误判根目录。
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
