import { Injectable } from "@nestjs/common";
import { defaultSettings, validateSettings, type SettingsResponse } from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { PrismaService } from "../prisma/prisma.service.js";

const CONFLICT = "Outra pessoa salvou os contatos enquanto você editava. Recarregue a página e refaça sua alteração.";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  /** Enquanto ninguém salvar, valem os dados que o site já exibia. */
  async get(): Promise<SettingsResponse> {
    const row = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!row) return { data: defaultSettings, version: null, updatedBy: "" };
    return { data: validateSettings(row.data).data, version: row.updatedAt.toISOString(), updatedBy: row.updatedBy };
  }

  /** `version` é a que a pessoa abriu: impede que uma edição apague a outra sem ninguém perceber. */
  async save(auth: AuthContext, input: unknown, version: string | null, client: ClientInfo): Promise<SettingsResponse> {
    const { data, errors } = validateSettings(input);
    if (Object.keys(errors).length) throw fail(422, "Revise os campos destacados.", { fields: errors });

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7423)`;
      const current = await tx.siteSettings.findUnique({ where: { id: 1 }, select: { updatedAt: true } });
      if ((current?.updatedAt.toISOString() ?? null) !== version) throw fail(409, CONFLICT);
      const values = { data, updatedBy: auth.user.email, updatedAt: new Date() };
      return tx.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...values }, update: values });
    });
    await this.audit.log(auth.user.email, "contatos_editados", client.ip, "Contatos e redes do site");
    return { data, version: row.updatedAt.toISOString(), updatedBy: row.updatedBy };
  }
}
