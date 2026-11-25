import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// fora do Docker, as variáveis vêm do .env na raiz do monorepo
if (existsSync("../../.env")) process.loadEnvFile("../../.env");

const monorepoRoot = path.join(process.cwd(), "../..");

const nextConfig: NextConfig = {
  // a imagem Docker usa o modo "standalone"; localmente usamos "next start"
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  // esconde o selo do Next.js que aparece no canto durante o desenvolvimento
  devIndicators: false,
  // envio de imagens pelo marketing (até 8 MB + folga do formulário)
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
  // páginas de acesso: sem iframe, sem vazar o endereço para terceiros e fora dos buscadores
  async headers() {
    const secure = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return ["/login", "/esqueci-senha", "/redefinir-senha", "/portal/:path*"].map((source) => ({ source, headers: secure }));
  },
  // Mantém os endereços antigos do WordPress funcionando
  async redirects() {
    return [{ source: "/testimonials/:slug", destination: "/#depoimentos", permanent: false }];
  },
};

export default nextConfig;
