import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { MIN_PASSWORD } from "@hr/shared";

// Uma das configurações recomendadas pela OWASP para scrypt (32 MiB, p=3).
const PARAMS = { N: 2 ** 15, r: 8, p: 3 };

function derive(password: string, salt: Buffer, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, { ...options, maxmem: 96 * 1024 * 1024 }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [, N, r, p, salt, hash] = stored.split("$");
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"), { N: Number(N), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

const COMMON = ["1234567890", "123456789012", "senha12345", "senha123456", "password123", "qwerty12345", "hrdaamazonia", "hramazonia123", "amazonia123", "manaus12345"];

/** Prioriza o tamanho (recomendação do NIST) em vez de exigir símbolos. */
export function passwordProblem(password: string, email: string) {
  if (password.length < MIN_PASSWORD) return `Use pelo menos ${MIN_PASSWORD} caracteres.`;
  if (password.length > 128) return "Use no máximo 128 caracteres.";
  const lower = password.toLowerCase();
  const user = email.split("@")[0].toLowerCase();
  if (user.length >= 4 && lower.includes(user)) return "A senha não pode conter o seu e-mail.";
  if (COMMON.includes(lower) || new Set(lower).size < 5) return "Essa senha é fácil demais de adivinhar.";
  return null;
}

export function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const block = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${block()}-${block()}-${block()}`;
}

export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const isEmail = (value: string) => value.length <= 200 && /^[^\s@<>",;|]+@[^\s@<>",;|]+\.[^\s@<>",;|]{2,}$/.test(value);
