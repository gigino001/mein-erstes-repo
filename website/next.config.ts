import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js' File-Tracing für Serverless-Functions verfolgt nur require()-Aufrufe,
  // die während des Builds selbst ausgeführt wurden (auf der Debian-Build-Maschine)
  // — die zusätzlich generierte rhel-openssl-Engine (siehe binaryTargets in
  // schema.prisma, nötig für die tatsächliche Netlify-Functions-Laufzeit) wird
  // dadurch nicht automatisch mit ins Bundle aufgenommen. Explizit erzwingen.
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
