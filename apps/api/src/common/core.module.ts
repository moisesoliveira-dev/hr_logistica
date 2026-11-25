import { Global, Module } from "@nestjs/common";
import { MailService } from "../mail/mail.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { ThrottleService } from "./throttle.service.js";

const providers = [PrismaService, AuditService, ThrottleService, MailService];

@Global()
@Module({ providers, exports: providers })
export class CoreModule {}
