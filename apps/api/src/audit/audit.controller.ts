import { Controller, Get } from "@nestjs/common";
import type { AuditEntry, Dashboard } from "@hr/shared";
import { AdminOnly, Auth, type AuthContext } from "../common/decorators.js";
import type { AuditLog } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

const toEntry = (row: AuditLog): AuditEntry => ({ id: row.id, at: row.at.toISOString(), actor: row.actor, event: row.event, detail: row.detail, ip: row.ip });

@Controller()
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @AdminOnly()
  @Get("audit")
  async list() {
    return (await this.prisma.auditLog.findMany({ orderBy: { id: "desc" }, take: 200 })).map(toEntry);
  }

  /** Painel inicial: a atividade da própria pessoa e, para administradores, os números gerais. */
  @Get("dashboard")
  async dashboard(@Auth() auth: AuthContext): Promise<Dashboard> {
    const recent = await this.prisma.auditLog.findMany({ where: { actor: auth.user.email }, orderBy: { id: "desc" }, take: 5 });
    let stats: Dashboard["stats"] = null;
    if (auth.user.role === "admin") {
      const since = new Date(Date.now() - 86_400_000);
      const [activeUsers, logins24h, failures24h] = await Promise.all([
        this.prisma.user.count({ where: { active: true } }),
        this.prisma.auditLog.count({ where: { event: "login", at: { gt: since } } }),
        this.prisma.auditLog.count({ where: { event: "login_falha", at: { gt: since } } }),
      ]);
      stats = { activeUsers, logins24h, failures24h };
    }
    return { recent: recent.map(toEntry), stats };
  }
}
