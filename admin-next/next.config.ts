import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Pin Turbopack to this folder so it doesn't walk up the filesystem and
 * pick a stray lockfile from a parent dir as the workspace root.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
