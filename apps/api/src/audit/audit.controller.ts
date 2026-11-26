import { Controller, Get, Query } from "@nestjs/common";
import { eventLabels, pageSizes, pageWindow, type AuditEntry, type Dashboard, type Paged } from "@hr/shared";
import { AdminOnly, Auth, type AuthContext } from "../common/decorators.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { DashboardService, toEntry } from "./dashboard.service.js";


@Controller()
export class AuditController {
  constructor(private readonly prisma: PrismaService, private readonly service: DashboardService) {}

  @AdminOnly()
  @Get("audit")
  async list(@Query("q") query: unknown, @Query("event") event: unknown, @Query("page") requested: unknown): Promise<Paged<AuditEntry>> {
    const q = typeof query === "string" ? query.trim().slice(0, 100) : "";
    const contains = { contains: q, mode: "insensitive" as const };
    // a busca vale para todo o histórico, não só para o que está na tela
    const where = {
      ...(typeof event === "string" && Object.hasOwn(eventLabels, event) ? { event } : {}),
      ...(q ? { OR: [{ actor: contains }, { detail: contains }, { ip: contains }] } : {}),
    };
    const total = await this.prisma.auditLog.count({ where });
    const pageSize = pageSizes.atividades;
    const { page, skip } = pageWindow(total, requested, pageSize);
    const rows = await this.prisma.auditLog.findMany({ where, orderBy: { id: "desc" }, skip, take: pageSize });
    return { items: rows.map(toEntry), total, page, pageSize };
  }

  /** Painel inicial: a atividade da própria pessoa e os números das áreas que o perfil dela alcança. */
  @Get("dashboard")
  dashboard(@Auth() auth: AuthContext): Promise<Dashboard> {
    return this.service.build(auth.user);
  }
}
