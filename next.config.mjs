/**
 * Next.js Configuration
 * This file configures the Next.js build and runtime settings,
 * including security headers and optimization options.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Configure HTTP headers to be added to all responses
  async headers() {
    // Allow unsafe-eval only in development for React Refresh hot module replacement
    const scriptSrc = process.env.NODE_ENV === "development" 
      ? "'self' 'unsafe-inline' 'unsafe-eval'" 
      : "'self' 'unsafe-inline'";

    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ");

    return [
      {
        // Apply headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy
          },
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
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
