import { Controller, Get } from "@nestjs/common";
import { NoInternalKey, Public } from "../common/decorators.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public() @NoInternalKey() @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
}
