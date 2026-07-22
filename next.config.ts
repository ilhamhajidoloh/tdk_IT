import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy tuned for this app:
// - Firebase Auth client SDK  -> connect/frame to *.googleapis.com / *.firebaseapp.com
// - Google Fonts in print/export pages -> style fonts.googleapis.com, font fonts.gstatic.com
// - inline theme script in layout.tsx + Next.js bootstrap -> script 'unsafe-inline'
// - SweetAlert2 / Sonner inject inline styles -> style 'unsafe-inline'
// - 'unsafe-eval' only in dev (Next.js HMR / source maps); dropped in production.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https:`,
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com`,
  `frame-src 'self' https://*.firebaseapp.com https://accounts.google.com`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
