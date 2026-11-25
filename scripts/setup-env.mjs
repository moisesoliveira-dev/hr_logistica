// Cria o arquivo .env da raiz com segredos aleatórios. Não sobrescreve um .env existente.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log(".env já existe; nada foi alterado.");
  process.exit(0);
}
const secret = () => randomBytes(32).toString("hex");
const password = secret();
const values = {
  POSTGRES_PASSWORD: password,
  DATABASE_URL: `postgresql://hr:${password}@localhost:5434/hr_portal`,
  INTERNAL_API_KEY: secret(),
  CAPTCHA_SECRET: secret(),
};
let text = readFileSync(".env.example", "utf8");
for (const [key, value] of Object.entries(values)) text = text.replace(new RegExp(`^${key}=.*$`, "m"), () => `${key}=${value}`);
writeFileSync(".env", text, { flag: "wx" });
console.log(".env criado com segredos aleatórios. Não envie esse arquivo para o Git.");
