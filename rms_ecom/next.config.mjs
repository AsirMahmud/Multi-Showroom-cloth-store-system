/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: (() => {
      const patterns = [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '8000',
          pathname: '/media/**',
        },
        {
          protocol: 'http',
          hostname: '127.0.0.1',
          port: '8000',
          pathname: '/media/**',
        },
      ];

      // Allow any backend domain from environment variable
      if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
          patterns.push({
            protocol: apiUrl.protocol.replace(':', ''),
            hostname: apiUrl.hostname,
            port: apiUrl.port || undefined,
            pathname: '/media/**',
          });
        } catch (e) {
          // Invalid URL, skip
        }
      }

      return patterns;
    })(),
  },
  // Skip trailing slash redirect (moved from experimental in Next.js 15+)
  skipTrailingSlashRedirect: true,
}

export default nextConfig
