import { Injectable } from "@nestjs/common";
import { isSiteSection, sectionDef, siteSectionKeys, type SiteItem, type SiteSection } from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import type { Prisma, SiteItem as Row } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { SiteItemDto } from "./dto.js";

const toItem = (r: Row): SiteItem => ({
  id: r.id, section: r.section, title: r.title, subtitle: r.subtitle, text: r.text, visible: r.visible,
  mediaId: r.mediaId, staticSrc: r.staticSrc, updatedBy: r.updatedBy, updatedAt: r.updatedAt.toISOString(),
});

const ordered = [{ position: "asc" }, { id: "asc" }] satisfies Prisma.SiteItemOrderByWithRelationInput[];

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  parseSection(value: string): SiteSection {
    if (!isSiteSection(value)) throw fail(404, "Área do site não encontrada.");
    return value;
  }

  /** Uma alteração por vez, para os limites e a ordem não serem furados por cliques simultâneos. */
  private locked<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7422)`;
      return work(tx);
    });
  }

  private async find(tx: Prisma.TransactionClient, id: number) {
    const item = await tx.siteItem.findUnique({ where: { id } });
    if (!item) throw fail(404, "Item não encontrado.");
    return item;
  }

  /** Lançar o erro dentro da transação desfaz a alteração. */
  private async checkLimits(tx: Prisma.TransactionClient, section: SiteSection) {
    const def = sectionDef(section);
    const visible = await tx.siteItem.count({ where: { section, visible: true } });
    if (visible > def.maxVisible) throw fail(409, `Esta área aceita no máximo ${def.maxVisible} itens visíveis. Oculte ou remova algum antes.`);
    if (visible < def.minVisible) throw fail(409, `Esta área precisa de pelo menos ${def.minVisible} item visível.`);
  }

  /** Confere os campos e decide qual imagem fica: a nova, nenhuma ou a atual. */
  private async validate(tx: Prisma.TransactionClient, section: SiteSection, input: SiteItemDto, current?: Row) {
    const def = sectionDef(section);
    const fields: Record<string, string> = {};
    const values = { title: "", subtitle: "", text: "" };
    for (const key of ["title", "subtitle", "text"] as const) {
      const rule = def[key];
      if (!rule) continue;
      const value = input[key].trim();
      if (rule.required && !value) fields[key] = "Preencha este campo.";
      else if (value.length > rule.max) fields[key] = `Use no máximo ${rule.max} caracteres.`;
      values[key] = value;
    }
    let image = { mediaId: current?.mediaId ?? null, staticSrc: current?.staticSrc ?? null };
    if (input.mediaId) {
      if (!(await tx.media.findUnique({ where: { id: input.mediaId }, select: { id: true } }))) fields.mediaId = "Imagem não encontrada.";
      image = { mediaId: input.mediaId, staticSrc: null };
    } else if (input.removeImage) image = { mediaId: null, staticSrc: null };
    if (def.image.required && !image.mediaId && !image.staticSrc) fields.mediaId = "Escolha uma imagem.";
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });
    return { ...values, ...image, visible: input.visible };
  }

  async list(section: SiteSection) {
    return (await this.prisma.siteItem.findMany({ where: { section }, orderBy: ordered })).map(toItem);
  }

  async summary() {
    const groups = await this.prisma.siteItem.groupBy({ by: ["section", "visible"], _count: { _all: true } });
    return siteSectionKeys.map((section) => {
      const own = groups.filter((g) => g.section === section);
      return { section, total: own.reduce((n, g) => n + g._count._all, 0), visible: own.find((g) => g.visible)?._count._all ?? 0 };
    });
  }

  async create(auth: AuthContext, section: SiteSection, input: SiteItemDto, client: ClientInfo) {
    const item = await this.locked(async (tx) => {
      const data = await this.validate(tx, section, input);
      const last = await tx.siteItem.aggregate({ where: { section }, _max: { position: true } });
      const created = await tx.siteItem.create({ data: { ...data, section, position: (last._max.position ?? 0) + 1, updatedBy: auth.user.email } });
      await this.checkLimits(tx, section);
      return created;
    });
    await this.log(auth, "publicacao_criada", item, client);
    return toItem(item);
  }

  async update(auth: AuthContext, id: number, input: SiteItemDto, client: ClientInfo) {
    const item = await this.locked(async (tx) => {
      const current = await this.find(tx, id);
      const data = await this.validate(tx, current.section, input, current);
      const updated = await tx.siteItem.update({ where: { id }, data: { ...data, updatedBy: auth.user.email } });
      await this.checkLimits(tx, current.section);
      return updated;
    });
    await this.log(auth, "publicacao_editada", item, client);
    return toItem(item);
  }

  /** Troca de lugar com o vizinho. */
  async move(id: number, direction: "up" | "down") {
    await this.locked(async (tx) => {
      const current = await this.find(tx, id);
      const items = await tx.siteItem.findMany({ where: { section: current.section }, orderBy: ordered, select: { id: true } });
      const from = items.findIndex((i) => i.id === id);
      const to = direction === "up" ? from - 1 : from + 1;
      if (to < 0 || to >= items.length) return;
      [items[from], items[to]] = [items[to], items[from]];
      for (const [index, item] of items.entries()) await tx.siteItem.update({ where: { id: item.id }, data: { position: index + 1 } });
    });
  }

  async remove(auth: AuthContext, id: number, client: ClientInfo) {
    const item = await this.locked(async (tx) => {
      const current = await this.find(tx, id);
      await tx.siteItem.delete({ where: { id } });
      await this.checkLimits(tx, current.section);
      return current;
    });
    await this.log(auth, "publicacao_removida", item, client);
  }

  private log(auth: AuthContext, event: string, item: Row, client: ClientInfo) {
    const def = sectionDef(item.section);
    return this.audit.log(auth.user.email, event, client.ip, `${def.label}${item.title ? `: ${item.title}` : ""}`);
  }

  /** Tudo o que está visível, para o site montar as páginas. Não expõe quem editou. */
  async publicContent() {
    const rows = await this.prisma.siteItem.findMany({ where: { visible: true }, orderBy: ordered, include: { media: { select: { alt: true } } } });
    return rows.map((r) => ({ ...toItem(r), updatedBy: "", mediaAlt: r.media?.alt ?? "" }));
  }
}
