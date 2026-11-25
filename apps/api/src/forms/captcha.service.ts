import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { config } from "../config.js";
import { PrismaService } from "../prisma/prisma.service.js";

/* Captcha simples, sem serviço externo. Barra robôs genéricos; para ataques direcionados, use Turnstile ou similar. */
const sign = (payload: string, code: string) => createHmac("sha256", config.captchaSecret).update(`${payload}:${code}`).digest("base64url");

/* Cada dígito é desenhado com segmentos, então o SVG não contém o texto da resposta. */
const points: Record<string, [number, number][]> = {
  a: [[0, 0], [18, 0]], b: [[18, 0], [18, 16]], c: [[18, 16], [18, 32]], d: [[0, 32], [18, 32]],
  e: [[0, 16], [0, 32]], f: [[0, 0], [0, 16]], g: [[0, 16], [18, 16]],
};
const digits = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];

function draw(code: string) {
  const jitter = (n: number) => (n + randomInt(-20, 21) / 10).toFixed(1);
  const strokes: string[] = [];
  [...code].forEach((ch, i) => {
    const x = 16 + i * 34, y = 12 + randomInt(-4, 5), angle = randomInt(-11, 12);
    const d = [...digits[Number(ch)]]
      .map((s) => `M${jitter(x + points[s][0][0])} ${jitter(y + points[s][0][1])}L${jitter(x + points[s][1][0])} ${jitter(y + points[s][1][1])}`)
      .sort(() => randomInt(-1, 2))
      .join("");
    strokes.push(`<path d="${d}" transform="rotate(${angle} ${x + 9} ${y + 16})" stroke="#0a2413" stroke-width="3.5"/>`);
  });
  for (let i = 0; i < 6; i++) {
    strokes.push(`<path d="M${randomInt(0, 60)} ${randomInt(0, 56)}Q${randomInt(60, 130)} ${randomInt(-10, 66)} ${randomInt(130, 190)} ${randomInt(0, 56)}" stroke="#0d9633" stroke-width="1.2" opacity=".55"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="56" viewBox="0 0 190 56" fill="none" stroke-linecap="round"><rect width="190" height="56" rx="12" fill="#e3f0d8"/>${strokes.join("")}</svg>`;
}

@Injectable()
export class CaptchaService {
  constructor(private readonly prisma: PrismaService) {}

  create() {
    const code = String(randomInt(0, 100000)).padStart(5, "0");
    const payload = `${Date.now() + 10 * 60_000}.${randomBytes(9).toString("base64url")}`;
    return { token: `${payload}.${sign(payload, code)}`, image: `data:image/svg+xml;base64,${Buffer.from(draw(code)).toString("base64")}` };
  }

  /** Cada token vale uma única tentativa, certa ou errada. O controle fica no banco. */
  async verify(token: string, answer: string) {
    const [expires, nonce, signature] = token.split(".");
    if (!expires || !nonce || !signature || nonce.length > 40 || !(Number(expires) > Date.now())) return false;
    const expected = Buffer.from(sign(`${expires}.${nonce}`, answer.trim()));
    const given = Buffer.from(signature);
    await this.prisma.usedCaptcha.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const consumed = await this.prisma.usedCaptcha.createMany({ data: [{ nonce, expiresAt: new Date(Number(expires)) }], skipDuplicates: true });
    return consumed.count === 1 && expected.length === given.length && timingSafeEqual(expected, given);
  }
}
