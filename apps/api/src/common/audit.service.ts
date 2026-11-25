import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actor: string, event: string, ip = "", detail = "") {
    await this.prisma.auditLog.create({ data: { actor, event, ip, detail } });
  }
}
