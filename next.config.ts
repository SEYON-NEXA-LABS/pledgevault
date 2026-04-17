import type { NextConfig } from "next";
import { execSync } from 'child_process';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.log('Git not found or no commits yet, using fallback.');
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: commitHash,
  },
};

export default nextConfig;
