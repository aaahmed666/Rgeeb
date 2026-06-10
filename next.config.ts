import type { NextConfig } from "next";

// Use environment variable for backend URL — falls back to dev for local development.
// Set BACKEND_URL in your deployment environment for production.
const BACKEND_URL = process.env.BACKEND_URL ?? "https://api.dev.rgeeb.com";

const nextConfig: NextConfig = {
  // Gzip/Brotli compress all responses — reduces transfer size significantly
  compress: true,

  // Fix: silence the "multiple lockfiles" workspace root warning.
  // Points output tracing to this project directory so Next.js doesn't
  // walk up to a parent directory that has its own package-lock.json.
  outputFileTracingRoot: __dirname,

  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend — eliminates CORS entirely
        // since the browser sees same-origin requests to localhost:3001/api/...
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
