import { createHash, timingSafeEqual } from "node:crypto";
import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { config } from "../config.js";
import { fail } from "./errors.js";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** A API só aceita chamadas do próprio site. */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>("noInternalKey", [context.getHandler(), context.getClass()])) return true;
    const given = String(context.switchToHttp().getRequest<Request>().headers["x-internal-key"] ?? "");
    if (!timingSafeEqual(digest(given), digest(config.internalKey))) throw fail(403, "Acesso negado.");
    return true;
  }
}
