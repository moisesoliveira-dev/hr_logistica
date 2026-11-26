/* Cadastros. Quem pode usar cada um é conferido no controller. */
import { Injectable } from "@nestjs/common";
import {
  isValidDocument, normalizeDocument, pageSizes, pageWindow, registries, searchText,
  type CustomerList, type NamedItem, type PlaceList, type StageItem, type StageKind,
} from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CustomerDto, DirectionDto, NamedDto, PlaceDto, StageDto } from "./dto.js";
import { loadStages } from "./lists.js";
import { isCity } from "./search.service.js";

const MISSING = "Cadastro não encontrado.";

const clean = (text: string) => text.trim().replace(/\s+/g, " ");
const same = (a: string, b: string) => searchText(a) === searchText(b);
const invalid = (fields: Record<string, string>) => fail(422, "Revise os campos.", { fields });
const isDuplicate = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const readName = (value: string, max = 60) => {
  const name = clean(value);
  if (name.length < 2 || name.length > max || !searchText(name)) throw invalid({ name: `Informe um nome com 2 a ${max} caracteres.` });
  return name;
};

/** Nome igual sem contar acento e maiúsculas também é repetido. */
const refuseRepeated = (rows: { key: string; name: string }[], name: string, except?: string) => {
  if (rows.some((r) => r.key !== except && same(r.name, name))) throw invalid({ name: "Já existe um cadastro com esse nome." });
};

/** Chave interna criada a partir do primeiro nome. Não muda quando o nome muda. */
const newKey = (name: string, taken: Set<string>) => {
  const base = searchText(name).replace(/ /g, "_").slice(0, 34) || "item";
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}_${i}`;
  return key;
};

@Injectable()
export class RegistryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private log(auth: AuthContext, event: "criado" | "editado" | "removido", singular: string, name: string, client: ClientInfo) {
    return this.audit.log(auth.user.email, `cadastro_${event}`, client.ip, `${singular}: ${name}`);
  }

  /** Alterações nas listas rodam uma de cada vez: assim não surgem nomes repetidos nem sobra lista vazia. */
  private locked<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7425)`;
      return work(tx);
    });
  }

  /* ───────── etapas ───────── */

  async stages(): Promise<StageItem[]> {
    const [stages, shipments, events] = await Promise.all([
      loadStages(this.prisma),
      this.prisma.shipment.groupBy({ by: ["stage"], _count: { _all: true } }),
      this.prisma.shipmentEvent.groupBy({ by: ["stage", "shipmentId"] }),
    ]);
    const uses = new Map<string, Set<number>>();
    for (const e of events) uses.set(e.stage, (uses.get(e.stage) ?? new Set()).add(e.shipmentId));
    return stages.map((s) => ({
      key: s.key, name: s.name, kind: s.kind, active: s.active,
      uses: uses.get(s.key)?.size ?? shipments.find((g) => g.stage === s.key)?._count._all ?? 0,
    }));
  }

  async createStage(auth: AuthContext, input: StageDto, client: ClientInfo) {
    const name = readName(input.name);
    if (input.kind !== "andamento" && input.kind !== "ocorrencia") throw invalid({ kind: "Escolha o tipo da etapa." });
    await this.locked(async (tx) => {
      const stages = await loadStages(tx);
      refuseRepeated(stages, name);
      const position = Math.max(0, ...stages.map((s) => s.position)) + 1;
      await tx.stage.create({ data: { key: newKey(name, new Set(stages.map((s) => s.key))), name, kind: input.kind as StageKind, position } });
    });
    await this.log(auth, "criado", registries.etapas.singular, name, client);
  }

  async updateStage(auth: AuthContext, key: string, input: StageDto, client: ClientInfo) {
    const name = readName(input.name);
    await this.locked(async (tx) => {
      const stages = await loadStages(tx);
      const current = stages.find((s) => s.key === key);
      if (!current) throw fail(404, MISSING);
      refuseRepeated(stages, name, key);
      if (!input.active) {
        if (current.kind === "inicio" || current.kind === "entrega") throw fail(409, "As etapas de início e de entrega não podem ser desativadas.");
        if (current.kind === "ocorrencia" && !stages.some((s) => s.kind === "ocorrencia" && s.active && s.key !== key)) {
          throw fail(409, "É preciso manter pelo menos um tipo de ocorrência ativo.");
        }
      }
      // o tipo nunca muda: o histórico das cargas depende dele
      await tx.stage.update({ where: { key }, data: { name, active: input.active } });
    });
    await this.log(auth, "editado", registries.etapas.singular, name, client);
  }

  /** Troca a etapa de lugar com a vizinha do mesmo tipo. */
  async moveStage(auth: AuthContext, key: string, input: DirectionDto, client: ClientInfo) {
    const name = await this.locked(async (tx) => {
      const stages = await loadStages(tx);
      const current = stages.find((s) => s.key === key);
      if (!current) throw fail(404, MISSING);
      const group = stages.filter((s) => s.kind === current.kind);
      const index = group.findIndex((s) => s.key === key);
      const other = group[index + (input.direction === "up" ? -1 : 1)];
      if (!other) return null;
      await tx.stage.update({ where: { key }, data: { position: other.position } });
      await tx.stage.update({ where: { key: other.key }, data: { position: current.position } });
      return current.name;
    });
    if (name) await this.log(auth, "editado", registries.etapas.singular, `${name} (ordem)`, client);
  }

  async removeStage(auth: AuthContext, key: string, client: ClientInfo) {
    const name = await this.locked(async (tx) => {
      const stages = await loadStages(tx);
      const current = stages.find((s) => s.key === key);
      if (!current) throw fail(404, MISSING);
      if (current.kind === "inicio" || current.kind === "entrega") throw fail(409, "As etapas de início e de entrega fazem parte do sistema.");
      if (current.kind === "ocorrencia" && !stages.some((s) => s.kind === "ocorrencia" && s.active && s.key !== key)) {
        throw fail(409, "É preciso manter pelo menos um tipo de ocorrência ativo.");
      }
      if ((await tx.shipmentEvent.count({ where: { stage: key } })) + (await tx.shipment.count({ where: { stage: key } }))) {
        throw fail(409, "Esta etapa já está no histórico de cargas. Desative em vez de excluir.");
      }
      await tx.stage.delete({ where: { key } });
      return current.name;
    });
    await this.log(auth, "removido", registries.etapas.singular, name, client);
  }

  /* ───────── tipos de transporte ───────── */

  async modes(): Promise<NamedItem[]> {
    const modes = await this.prisma.transportMode.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { shipments: true } } } });
    return modes.map((m) => ({ key: m.key, name: m.name, active: m.active, uses: m._count.shipments }));
  }

  async saveMode(auth: AuthContext, key: string | null, input: NamedDto, client: ClientInfo) {
    const name = readName(input.name);
    await this.locked(async (tx) => {
      const modes = await tx.transportMode.findMany();
      if (key && !modes.some((m) => m.key === key)) throw fail(404, MISSING);
      refuseRepeated(modes, name, key ?? undefined);
      if (!input.active && !modes.some((m) => m.active && m.key !== key)) throw fail(409, "É preciso manter pelo menos um tipo de transporte ativo.");
      if (key) await tx.transportMode.update({ where: { key }, data: { name, active: input.active } });
      else await tx.transportMode.create({ data: { key: newKey(name, new Set(modes.map((m) => m.key))), name, active: input.active } });
    });
    await this.log(auth, key ? "editado" : "criado", registries.transportes.singular, name, client);
  }

  async removeMode(auth: AuthContext, key: string, client: ClientInfo) {
    const name = await this.locked(async (tx) => {
      const modes = await tx.transportMode.findMany();
      const current = modes.find((m) => m.key === key);
      if (!current) throw fail(404, MISSING);
      if (!modes.some((m) => m.active && m.key !== key)) throw fail(409, "É preciso manter pelo menos um tipo de transporte ativo.");
      if (await tx.shipment.count({ where: { mode: key } })) throw fail(409, "Há cargas com este transporte. Desative em vez de excluir.");
      await tx.transportMode.delete({ where: { key } });
      return current.name;
    });
    await this.log(auth, "removido", registries.transportes.singular, name, client);
  }

  /* ───────── setores ───────── */

  async departments(): Promise<NamedItem[]> {
    const [departments, users] = await Promise.all([
      this.prisma.department.findMany({ orderBy: { name: "asc" } }),
      this.prisma.user.groupBy({ by: ["department"], _count: { _all: true } }),
    ]);
    return departments.map((d) => ({ key: String(d.id), name: d.name, active: d.active, uses: users.find((u) => u.department === d.name)?._count._all ?? 0 }));
  }

  async saveDepartment(auth: AuthContext, id: number | null, input: NamedDto, client: ClientInfo) {
    const name = readName(input.name);
    await this.locked(async (tx) => {
      const rows = await tx.department.findMany();
      const current = rows.find((d) => d.id === id);
      if (id !== null && !current) throw fail(404, MISSING);
      refuseRepeated(rows.map((d) => ({ key: String(d.id), name: d.name })), name, id === null ? undefined : String(id));
      if (!input.active && !rows.some((d) => d.active && d.id !== id)) throw fail(409, "É preciso manter pelo menos um setor ativo.");
      if (!current) {
        await tx.department.create({ data: { name, active: input.active } });
        return;
      }
      await tx.department.update({ where: { id: current.id }, data: { name, active: input.active } });
      // as contas acompanham o novo nome do setor
      if (current.name !== name) await tx.user.updateMany({ where: { department: current.name }, data: { department: name } });
    });
    await this.log(auth, id === null ? "criado" : "editado", registries.setores.singular, name, client);
  }

  async removeDepartment(auth: AuthContext, id: number, client: ClientInfo) {
    const name = await this.locked(async (tx) => {
      const rows = await tx.department.findMany();
      const current = rows.find((d) => d.id === id);
      if (!current) throw fail(404, MISSING);
      if (!rows.some((d) => d.active && d.id !== id)) throw fail(409, "É preciso manter pelo menos um setor ativo.");
      if (await tx.user.count({ where: { department: current.name } })) throw fail(409, "Há contas neste setor. Mude o setor delas ou desative este.");
      await tx.department.delete({ where: { id } });
      return current.name;
    });
    await this.log(auth, "removido", registries.setores.singular, name, client);
  }

  /* ───────── clientes ───────── */

  async customers(query: string, requested: string): Promise<CustomerList> {
    const words = searchText(query.slice(0, 100)).split(" ").filter(Boolean).slice(0, 6);
    const document = normalizeDocument(query.slice(0, 100));
    const where: Prisma.CustomerWhereInput = words.length
      ? { OR: [{ AND: words.map((w) => ({ search: { contains: w } })) }, ...(/\d{4,}/.test(document) ? [{ document: { contains: document } }] : [])] }
      : {};
    const total = await this.prisma.customer.count({ where });
    const pageSize = pageSizes.cadastros;
    const { page, skip } = pageWindow(total, requested, pageSize);
    const rows = await this.prisma.customer.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip, take: pageSize });
    const cargos = await this.prisma.shipment.groupBy({ by: ["customerDocument"], where: { customerDocument: { in: rows.map((r) => r.document) } }, _count: { _all: true } });
    return { items: rows.map((r) => ({ id: r.id, name: r.name, document: r.document, cargos: cargos.find((c) => c.customerDocument === r.document)?._count._all ?? 0 })), total, page, pageSize };
  }

  async saveCustomer(auth: AuthContext, id: number | null, input: CustomerDto, client: ClientInfo) {
    const name = clean(input.name);
    const document = normalizeDocument(input.document);
    const fields: Record<string, string> = {};
    if (name.length < 3 || name.length > 150 || !searchText(name)) fields.name = "Informe o nome do cliente.";
    if (!isValidDocument(document)) fields.document = "CNPJ ou CPF inválido.";
    if (Object.keys(fields).length) throw invalid(fields);
    const data = { name, document, search: searchText(name).slice(0, 150) };
    try {
      if (id === null) await this.prisma.customer.create({ data });
      else if (!(await this.prisma.customer.updateMany({ where: { id }, data })).count) throw fail(404, MISSING);
    } catch (error) {
      if (isDuplicate(error)) throw invalid({ document: "Já existe um cliente com esse CNPJ ou CPF." });
      throw error;
    }
    await this.log(auth, id === null ? "criado" : "editado", registries.clientes.singular, name, client);
  }

  /** As cargas guardam o próprio nome e documento: excluir o cadastro não mexe nelas. */
  async removeCustomer(auth: AuthContext, id: number, client: ClientInfo) {
    const current = await this.prisma.customer.findUnique({ where: { id }, select: { name: true } });
    if (!current || !(await this.prisma.customer.deleteMany({ where: { id } })).count) throw fail(404, MISSING);
    await this.log(auth, "removido", registries.clientes.singular, current.name, client);
  }

  /* ───────── locais ───────── */

  async places(query: string, requested: string): Promise<PlaceList> {
    const words = searchText(query.slice(0, 100)).split(" ").filter(Boolean).slice(0, 6);
    const where: Prisma.PlaceWhereInput = words.length ? { AND: words.map((w) => ({ search: { contains: w } })) } : {};
    const total = await this.prisma.place.count({ where });
    const pageSize = pageSizes.cadastros;
    const { page, skip } = pageWindow(total, requested, pageSize);
    const items = await this.prisma.place.findMany({ where, orderBy: [{ name: "asc" }, { city: "asc" }], skip, take: pageSize, select: { id: true, name: true, city: true } });
    return { items, total, page, pageSize };
  }

  async savePlace(auth: AuthContext, id: number | null, input: PlaceDto, client: ClientInfo) {
    const name = clean(input.name);
    const city = clean(input.city);
    const fields: Record<string, string> = {};
    if (name.length < 2 || name.length > 80 || !searchText(name)) fields.name = "Informe o nome do local (até 80 caracteres).";
    if (!isCity(city)) fields.city = "Escolha uma cidade da lista que aparece ao digitar.";
    if (Object.keys(fields).length) throw invalid(fields);
    const data = { name, city, search: searchText(`${name} ${city}`).slice(0, 150) };
    await this.locked(async (tx) => {
      const others = await tx.place.findMany({ where: { city, ...(id === null ? {} : { id: { not: id } }) }, select: { name: true } });
      if (others.some((p) => same(p.name, name))) throw invalid({ name: "Já existe um local com esse nome nessa cidade." });
      if (id === null) await tx.place.create({ data });
      else if (!(await tx.place.updateMany({ where: { id }, data })).count) throw fail(404, MISSING);
    });
    await this.log(auth, id === null ? "criado" : "editado", registries.locais.singular, `${name}, ${city}`, client);
  }

  async removePlace(auth: AuthContext, id: number, client: ClientInfo) {
    const current = await this.prisma.place.findUnique({ where: { id } });
    if (!current || !(await this.prisma.place.deleteMany({ where: { id } })).count) throw fail(404, MISSING);
    await this.log(auth, "removido", registries.locais.singular, `${current.name}, ${current.city}`, client);
  }
}
