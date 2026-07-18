import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
] as const;

// GitHub Pages build: static Replay-only export served under /SishyaGuru.
// Response headers cannot be set on a static host, so the headers() config
// only applies to the normal server build.
const isPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isPagesExport
  ? {
      output: "export",
      basePath: "/SishyaGuru",
      env: { NEXT_PUBLIC_REPLAY_ONLY: "1" },
    }
  : {
      async headers() {
        return [{ source: "/(.*)", headers: [...securityHeaders] }];
      },
    };

export default nextConfig;
