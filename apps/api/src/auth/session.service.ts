import { Injectable } from "@nestjs/common";
import type { NewSession, SessionUser } from "@hr/shared";
import type { ClientInfo } from "../common/decorators.js";
import type { Prisma, User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { newToken, sha256 } from "./password.js";

const HOUR = 3_600_000;
const SESSION_HOURS = 12; // sem "manter conectado"
const IDLE_HOURS = 2; // sem "manter conectado"
const REMEMBER_DAYS = 30;

export const toSessionUser = (user: User): SessionUser => ({
  id: user.id, name: user.name, email: user.email, department: user.department, role: user.role,
  mustChangePassword: user.mustChangePassword, createdAt: user.createdAt.toISOString(),
});

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, remember: boolean, client: ClientInfo, db: Prisma.TransactionClient = this.prisma): Promise<Omit<NewSession, "mustChangePassword">> {
    const token = newToken();
    const lifetime = remember ? REMEMBER_DAYS * 24 * HOUR : SESSION_HOURS * HOUR;
    await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.session.create({
      data: { tokenHash: sha256(token), userId, remember, expiresAt: new Date(Date.now() + lifetime), ip: client.ip, userAgent: client.userAgent },
    });
    return { token, remember, maxAgeSeconds: lifetime / 1000 };
  }

  /** Valida o token no banco, aplicando expiração e inatividade. */
  async validate(token: string) {
    if (!token) return null;
    const tokenHash = sha256(token);
    const session = await this.prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
    const now = Date.now();
    if (!session || session.expiresAt.getTime() <= now || !session.user.active) return null;
    const idle = now - session.lastSeenAt.getTime();
    if (!session.remember && idle > IDLE_HOURS * HOUR) {
      await this.prisma.session.deleteMany({ where: { id: session.id } });
      return null;
    }
    if (idle > 60_000) await this.prisma.session.updateMany({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    return { sessionId: session.id, remember: session.remember, tokenHash, user: session.user };
  }

  async revokeAll(userId: number, db: Prisma.TransactionClient = this.prisma) {
    await db.session.deleteMany({ where: { userId } });
    await db.resetToken.deleteMany({ where: { userId } });
  }
}
