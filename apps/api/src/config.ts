import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// fora do Docker, as variáveis vêm do .env na raiz do monorepo
const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

function required(name: string, minLength = 1) {
  const value = process.env[name] ?? "";
  if (value.length < minLength) {
    throw new Error(`Variável ${name} ausente ou curta demais. Rode "npm run setup" na raiz do projeto.`);
  }
  return value;
}

export const config = {
  /** Atalhos de desenvolvimento só valem quando pedidos explicitamente. */
  isDev: process.env.NODE_ENV === "development" || process.env.npm_lifecycle_event === "dev",
  get databaseUrl() { return required("DATABASE_URL"); },
  get internalKey() { return required("INTERNAL_API_KEY", 32); },
  get captchaSecret() { return required("CAPTCHA_SECRET", 32); },
  port: Number(process.env.API_PORT || 3333),
  appUrl: process.env.APP_URL ?? "",
};
