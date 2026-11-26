import { Injectable } from "@nestjs/common";
import { canEditContent, canManageCargo, DONE_STAGE, type AuditEntry, type CargoOverview, type ContentOverview, type Dashboard, type DayCount } from "@hr/shared";
import type { AuditLog, User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { loadStages, toStageRef } from "../registry/lists.js";

export const toEntry = (row: AuditLog): AuditEntry => ({ id: row.id, at: row.at.toISOString(), actor: row.actor, event: row.event, detail: row.detail, ip: row.ip });

const DAY = 86_400_000;
// Manaus fica em UTC-4 o ano todo
const MANAUS = 4 * 3_600_000;
const manausDay = (date: Date) => new Date(date.getTime() - MANAUS).toISOString().slice(0, 10);

/** Os últimos `total` dias, do mais antigo até hoje, e o instante em que o primeiro começa. */
function lastDays(total: number) {
  const now = Date.now();
  const days = Array.from({ length: total }, (_, i) => manausDay(new Date(now - (total - 1 - i) * DAY)));
  return { days, since: new Date(new Date(`${days[0]}T00:00:00Z`).getTime() + MANAUS) };
}

const countByDay = (days: string[], dates: Date[]): DayCount[] => {
  const totals = new Map(days.map((d) => [d, 0]));
  for (const date of dates) {
    const key = manausDay(date);
    if (totals.has(key)) totals.set(key, totals.get(key)! + 1);
  }
  return days.map((day) => ({ day, count: totals.get(day)! }));
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async build(user: User): Promise<Dashboard> {
    const [recent, stats, cargo, content] = await Promise.all([
      this.prisma.auditLog.findMany({ where: { actor: user.email }, orderBy: { id: "desc" }, take: 5 }),
      user.role === "admin" ? this.access() : null,
      canManageCargo(user.role) ? this.cargo() : null,
      canEditContent(user.role) ? this.content() : null,
    ]);
    return { recent: recent.map(toEntry), stats, cargo, content };
  }

  private async access() {
    const week = lastDays(7);
    const [activeUsers, failures24h, logins] = await Promise.all([
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.auditLog.count({ where: { event: "login_falha", at: { gt: new Date(Date.now() - DAY) } } }),
      this.prisma.auditLog.findMany({ where: { event: "login", at: { gte: week.since } }, select: { at: true } }),
    ]);
    return { activeUsers, failures24h, logins: countByDay(week.days, logins.map((l) => l.at)) };
  }

  private async cargo(): Promise<CargoOverview> {
    const period = lastDays(14);
    // a previsão é uma data sem hora: está atrasada a partir do dia seguinte
    const today = new Date(`${manausDay(new Date())}T00:00:00Z`);
    const lateWhere = { stage: { not: DONE_STAGE }, expectedAt: { lt: today } };
    const attentionWhere = { OR: [{ stageInfo: { kind: "ocorrencia" as const } }, lateWhere] };
    const [list, groups, late, delivered, attention] = await Promise.all([
      loadStages(this.prisma),
      this.prisma.shipment.groupBy({ by: ["stage"], _count: { _all: true } }),
      this.prisma.shipment.count({ where: lateWhere }),
      // só conta quem continua entregue; um lançamento corrigido não vale
      this.prisma.shipmentEvent.findMany({ where: { stage: DONE_STAGE, at: { gte: period.since }, shipment: { stage: DONE_STAGE } }, orderBy: [{ at: "desc" }, { id: "desc" }], select: { shipmentId: true, at: true } }),
      this.prisma.shipment.findMany({ where: attentionWhere, orderBy: [{ expectedAt: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }], take: 6, include: { stageInfo: true } }),
    ]);

    // uma entrega por carga, mesmo que a etapa tenha sido lançada duas vezes
    const byShipment = new Map<number, Date>();
    for (const event of delivered) if (!byShipment.has(event.shipmentId)) byShipment.set(event.shipmentId, event.at);
    const deliveries = countByDay(period.days, [...byShipment.values()]);

    // etapa desativada só aparece enquanto ainda houver carga parada nela
    const stages = list
      .map((s) => ({ stage: toStageRef(s), active: s.active, count: groups.find((g) => g.stage === s.key)?._count._all ?? 0 }))
      .filter((s) => s.active || s.count)
      .map(({ stage, count }) => ({ stage, count }));
    const total = (match: (s: (typeof stages)[number]) => boolean) => stages.filter(match).reduce((n, s) => n + s.count, 0);
    return {
      open: total((s) => s.stage.key !== DONE_STAGE),
      occurrences: total((s) => s.stage.kind === "ocorrencia"),
      late,
      deliveredWeek: deliveries.slice(-7).reduce((n, d) => n + d.count, 0),
      stages,
      deliveries,
      attention: attention.map((s) => ({
        id: s.id, code: s.code, customerName: s.customerName, stage: toStageRef(s.stageInfo),
        expectedAt: s.expectedAt?.toISOString().slice(0, 10) ?? "",
        late: s.stage !== DONE_STAGE && s.expectedAt !== null && s.expectedAt < today,
      })),
    };
  }

  private async content(): Promise<ContentOverview> {
    const [published, drafts, images, siteItems, latest] = await Promise.all([
      this.prisma.post.count({ where: { status: "publicado" } }),
      this.prisma.post.count({ where: { status: "rascunho" } }),
      this.prisma.media.count(),
      this.prisma.siteItem.count({ where: { visible: true } }),
      this.prisma.post.findMany({ orderBy: { updatedAt: "desc" }, take: 4, select: { id: true, title: true, status: true, updatedAt: true } }),
    ]);
    return { published, drafts, images, siteItems, latest: latest.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() })) };
  }
}
