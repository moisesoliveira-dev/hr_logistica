import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// no desenvolvimento o .env fica na raiz do monorepo; no Docker as variáveis vêm do compose
if (existsSync("../../.env")) process.loadEnvFile("../../.env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // "prisma generate" não precisa de banco, então a URL pode faltar nessa etapa
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
