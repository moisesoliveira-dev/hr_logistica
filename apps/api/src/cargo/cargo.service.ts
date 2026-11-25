import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  CARGO_CODE_ALPHABET, cargoStageKeys, cargoStages, isValidDocument, normalizeCargoCode, normalizeDocument,
  type CargoDetail, type CargoList, type CargoStage, type CargoSummary, type PublicCargo,
} from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { ThrottleService } from "../common/throttle.service.js";
import { Prisma, type Shipment, type ShipmentEvent } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CargoDto, CargoEventDto } from "./dto.js";

const PAGE = 50;
const NOT_FOUND = "Não encontramos uma carga com esse código e CNPJ/CPF. Confira os dados.";
const newestFirst = [{ at: "desc" }, { id: "desc" }] satisfies Prisma.ShipmentEventOrderByWithRelationInput[];

const day = (date: Date | null) => date?.toISOString().slice(0, 10) ?? "";

const toSummary = (s: Shipment): CargoSummary => ({
  id: s.id, code: s.code, invoice: s.invoice, customerName: s.customerName, origin: s.origin, destination: s.destination,
  stage: s.stage, expectedAt: day(s.expectedAt), updatedAt: s.updatedAt.toISOString(),
});

const toEvent = (e: ShipmentEvent) => ({ id: e.id, stage: e.stage, location: e.location, note: e.note, at: e.at.toISOString(), createdBy: e.createdBy });

const newCode = () => {
  const block = () => Array.from({ length: 4 }, () => CARGO_CODE_ALPHABET[randomInt(CARGO_CODE_ALPHABET.length)]).join("");
  return `HR-${block()}-${block()}`;
};

@Injectable()
export class CargoService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly throttle: ThrottleService) {}

  async list(query: string, stage: string): Promise<CargoList> {
    const q = query.trim().slice(0, 100);
    const document = normalizeDocument(q);
    const code = normalizeCargoCode(q);
    const where: Prisma.ShipmentWhereInput = {
      ...(cargoStageKeys.includes(stage as CargoStage) ? { stage: stage as CargoStage } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: code ?? q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { invoice: { contains: q, mode: "insensitive" } },
              ...(/\d{5,}/.test(document) ? [{ customerDocument: { contains: document } }] : []),
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({ where, orderBy: { updatedAt: "desc" }, take: PAGE }),
      this.prisma.shipment.count({ where }),
    ]);
    return { items: items.map(toSummary), total };
  }

  async get(id: number): Promise<CargoDetail> {
    const shipment = await this.prisma.shipment.findUnique({ where: { id }, include: { events: { orderBy: newestFirst } } });
    if (!shipment) throw fail(404, "Carga não encontrada.");
    return { ...toSummary(shipment), customerDocument: shipment.customerDocument, mode: shipment.mode, events: shipment.events.map(toEvent) };
  }

  private validate(input: CargoDto) {
    const fields: Record<string, string> = {};
    const data = {
      invoice: input.invoice.trim(),
      customerName: input.customerName.trim(),
      customerDocument: normalizeDocument(input.customerDocument),
      origin: input.origin.trim(),
      destination: input.destination.trim(),
      mode: input.mode,
      expectedAt: null as Date | null,
    };
    if (data.invoice.length > 60) fields.invoice = "Use no máximo 60 caracteres.";
    if (data.customerName.length < 3 || data.customerName.length > 150) fields.customerName = "Informe o nome do cliente.";
    if (!isValidDocument(data.customerDocument)) fields.customerDocument = "CNPJ ou CPF inválido.";
    if (data.origin.length < 2 || data.origin.length > 120) fields.origin = "Informe a origem.";
    if (data.destination.length < 2 || data.destination.length > 120) fields.destination = "Informe o destino.";
    const expected = input.expectedAt.trim();
    if (expected) {
      const date = new Date(`${expected}T00:00:00Z`);
      // rejeita datas que não existem, como 31/02
      if (!/^20\d{2}-\d{2}-\d{2}$/.test(expected) || Number.isNaN(date.getTime()) || day(date) !== expected) fields.expectedAt = "Data inválida.";
      else data.expectedAt = date;
    }
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });
    return data;
  }

  private validateEvent(input: CargoEventDto) {
    const fields: Record<string, string> = {};
    const location = input.location.trim();
    const note = input.note.trim();
    if (location.length < 2 || location.length > 120) fields.location = "Informe o local.";
    if (note.length > 500) fields.note = "Use no máximo 500 caracteres.";
    if (input.stage === "ocorrencia" && !note) fields.note = "Explique a ocorrência. O cliente verá este texto.";
    let at = new Date();
    if (input.at) {
      // Manaus fica em UTC-4 o ano todo
      at = new Date(`${input.at}:00-04:00`);
      if (!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.at) || Number.isNaN(at.getTime())) fields.at = "Data e hora inválidas.";
      else if (at.getTime() > Date.now() + 5 * 60_000) fields.at = "A data não pode estar no futuro.";
    }
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });
    return { stage: input.stage, location, note, at };
  }

  async create(auth: AuthContext, input: CargoDto, client: ClientInfo) {
    const data = this.validate(input);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const shipment = await this.prisma.shipment.create({
          data: {
            ...data, code: newCode(), stage: "aguardando_coleta", createdBy: auth.user.email,
            events: { create: { stage: "aguardando_coleta", location: data.origin, note: "", at: new Date(), createdBy: auth.user.email } },
          },
        });
        await this.audit.log(auth.user.email, "carga_criada", client.ip, shipment.code);
        return toSummary(shipment);
      } catch (error) {
        // código repetido: sorteia outro
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
    throw fail(500, "Não foi possível gerar o código da carga. Tente novamente.");
  }

  async update(auth: AuthContext, id: number, input: CargoDto, client: ClientInfo) {
    const data = this.validate(input);
    const current = await this.prisma.shipment.findUnique({ where: { id }, select: { code: true } });
    if (!current) throw fail(404, "Carga não encontrada.");
    await this.prisma.shipment.update({ where: { id }, data });
    await this.audit.log(auth.user.email, "carga_editada", client.ip, current.code);
  }

  /** Altera o histórico e recalcula a etapa atual, uma alteração por vez. */
  private changeHistory(id: number, change: (tx: Prisma.TransactionClient) => Promise<void>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7424)`;
      const shipment = await tx.shipment.findUnique({ where: { id }, select: { code: true } });
      if (!shipment) throw fail(404, "Carga não encontrada.");
      await change(tx);
      const latest = await tx.shipmentEvent.findFirst({ where: { shipmentId: id }, orderBy: newestFirst, select: { stage: true } });
      if (!latest) throw fail(409, "A carga precisa ter pelo menos uma etapa no histórico.");
      await tx.shipment.update({ where: { id }, data: { stage: latest.stage, updatedAt: new Date() } });
      return shipment.code;
    });
  }

  async addEvent(auth: AuthContext, id: number, input: CargoEventDto, client: ClientInfo) {
    const event = this.validateEvent(input);
    const code = await this.changeHistory(id, async (tx) => {
      await tx.shipmentEvent.create({ data: { ...event, shipmentId: id, createdBy: auth.user.email } });
    });
    await this.audit.log(auth.user.email, "carga_atualizada", client.ip, `${code}: ${cargoStages[event.stage]}`);
  }

  async removeEvent(auth: AuthContext, id: number, eventId: number, client: ClientInfo) {
    let removed = "";
    const code = await this.changeHistory(id, async (tx) => {
      const event = await tx.shipmentEvent.findFirst({ where: { id: eventId, shipmentId: id } });
      if (!event) throw fail(404, "Etapa não encontrada.");
      removed = cargoStages[event.stage];
      await tx.shipmentEvent.delete({ where: { id: eventId } });
    });
    await this.audit.log(auth.user.email, "carga_etapa_removida", client.ip, `${code}: ${removed}`);
  }

  async remove(auth: AuthContext, id: number, client: ClientInfo) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id }, select: { code: true } });
    if (!shipment) throw fail(404, "Carga não encontrada.");
    await this.prisma.shipment.delete({ where: { id } });
    await this.audit.log(auth.user.email, "carga_removida", client.ip, shipment.code);
  }

  /** Consulta do cliente. Só os erros contam para o limite; a mensagem não diz qual dado está errado. */
  async track(rawCode: string, rawDocument: string, client: ClientInfo): Promise<PublicCargo> {
    const key = `rastreio-ip:${client.ip}`;
    // conta antes de consultar, para pedidos simultâneos não furarem o limite
    if ((await this.throttle.hit(key, 15 * 60_000)) > 20) throw fail(429, "Muitas consultas sem sucesso. Aguarde 15 minutos.");
    const code = normalizeCargoCode(rawCode);
    const shipment = code ? await this.prisma.shipment.findUnique({ where: { code }, include: { events: { orderBy: newestFirst } } }) : null;
    if (!shipment || shipment.customerDocument !== normalizeDocument(rawDocument)) throw fail(404, NOT_FOUND);
    await this.throttle.undo(key);
    const { invoice, origin, destination, mode, stage, expectedAt, events } = shipment;
    return {
      code: shipment.code, invoice, origin, destination, mode, stage, expectedAt: day(expectedAt),
      events: events.map((e) => ({ id: e.id, stage: e.stage, location: e.location, note: e.note, at: e.at.toISOString() })),
    };
  }
}
