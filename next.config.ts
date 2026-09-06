import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { existsSync } from "node:fs";
import { join } from "node:path";

const nextConfig: NextConfig = {
  // Vercel keeps its native build path. The VPS release builder opts in explicitly so a
  // self-contained Node.js server can be packaged without changing Production behavior.
  output: process.env.PORTFOLIO_STANDALONE === "1" ? "standalone" : undefined,
  // Immutable VPS release directories are mounted read-only by systemd. Serve original local
  // images there instead of requiring Next.js to create an on-disk optimization cache.
  images: {
    unoptimized: process.env.PORTFOLIO_STANDALONE === "1",
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  env: {
    NEXT_PUBLIC_RESUME_AVAILABLE: String(existsSync(join(process.cwd(), "public", "resume.pdf"))),
  },
  // Next's webpack filesystem cache does not currently track tsconfig.json on this path. The
  // Chinese lineation layer is selected through jsxImportSource, so a branch switch that changes
  // that compiler option must invalidate every cached module instead of leaving one page with a
  // mixture of React's default JSX runtime and the phrase-aware runtime.
  webpack(config) {
    if (config.cache && typeof config.cache === "object" && config.cache.type === "filesystem") {
      const dependencyKey = "portfolio-tsconfig";
      const prior = config.cache.buildDependencies?.[dependencyKey] ?? [];
      config.cache.buildDependencies = {
        ...config.cache.buildDependencies,
        [dependencyKey]: Array.from(new Set([...prior, join(process.cwd(), "tsconfig.json")])),
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: "/ai",
        destination: "/#agent-systems",
        permanent: true,
      },
      {
        source: "/engineering",
        destination: "/#systems",
        permanent: true,
      },
      {
        source: "/analytics",
        destination: "/#archive",
        permanent: true,
      },
      {
        source: "/analytics/analytics-tandem",
        destination: "/#archive",
        permanent: true,
      },
      {
        source: "/engineering/p1-reliability-lab",
        destination: "/engineering/exactly-once-drills",
        permanent: true,
      },
      {
        source: "/analytics/credit-policy-lab",
        destination: "/analytics/credit-policy-desk",
        permanent: true,
      },
      {
        source: "/ai/privacy-preflight-mac",
        destination: "/ai/privacy-preflight",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "connect-src 'self'",
              "font-src 'self' data:",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "img-src 'self' data: blob:",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "worker-src 'self' blob:",
              ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
