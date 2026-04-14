/**
 * Next.js Configuration
 * This file configures the Next.js build and runtime settings,
 * including security headers and optimization options.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Configure HTTP headers to be added to all responses
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: "/(.*)",
        headers: [
          {
            // Prevent browsers from interpreting files as a different MIME type
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            // Control when browser sends Referer header for security
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            // Prevent page from being loaded in iframe - protects against clickjacking
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            // Disable access to sensitive hardware like camera, microphone, geolocation
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
