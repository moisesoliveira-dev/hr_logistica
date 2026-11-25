import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Conta uma tentativa (de forma atômica) e devolve o total na janela atual. */
  async hit(key: string, windowMs: number) {
    const until = new Date(Date.now() + windowMs);
    const rows = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO throttle (key, count, reset_at) VALUES (${key}, 1, ${until})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN throttle.reset_at < now() THEN 1 ELSE throttle.count + 1 END,
        reset_at = CASE WHEN throttle.reset_at < now() THEN EXCLUDED.reset_at ELSE throttle.reset_at END
      RETURNING count`;
    return rows[0].count;
  }

  async forget(key: string) {
    await this.prisma.throttle.deleteMany({ where: { key } });
  }

  async undo(key: string) {
    await this.prisma.$executeRaw`UPDATE throttle SET count = GREATEST(count - 1, 0) WHERE key = ${key}`;
  }

  /** Libera o login de um e-mail, vindo de qualquer IP. */
  async unlockLogin(email: string) {
    await this.prisma.$executeRaw`DELETE FROM throttle WHERE key = ${`login:${email}`} OR starts_with(key, ${`login:${email}|`})`;
  }

  /** E-mails com o limite estourado: "login:email" (30) ou "login:email|ip" (5). */
  async blockedLogins() {
    const rows = await this.prisma.throttle.findMany({ where: { key: { startsWith: "login:" }, resetAt: { gt: new Date() }, count: { gt: 5 } } });
    return new Set(rows.filter((r) => r.key.includes("|") || r.count > 30).map((r) => r.key.slice(6).split("|")[0]));
  }
}
