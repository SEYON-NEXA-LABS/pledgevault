import type { NextConfig } from "next";
import { execSync } from 'child_process';
import pkg from './package.json';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.log('Git not found or no commits yet, using fallback.');
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_BUILD: commitHash,
  },
};

export default nextConfig;
