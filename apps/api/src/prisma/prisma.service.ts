import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client.js";
import { clientOptions } from "./client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super(clientOptions());
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
