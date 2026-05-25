import type { NextConfig } from "next";

const BACKEND_URL = "https://api.dev.rgeeb.com";

const nextConfig: NextConfig = {
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
