import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@hr/shared";
import type { AuthedRequest } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { SessionService } from "./session.service.js";

/** Guarda global: exige sessão válida em tudo que não for marcado como @Public(). */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext) {
    const flag = (name: string) => this.reflector.getAllAndOverride<boolean>(name, [context.getHandler(), context.getClass()]);
    if (flag("public")) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = /^Bearer (\S+)$/.exec(request.headers.authorization ?? "")?.[1] ?? "";
    const auth = await this.sessions.validate(token);
    if (!auth) throw fail(401, "Sessão expirada. Entre novamente.");
    if (auth.user.mustChangePassword && !flag("allowPendingPassword")) {
      throw fail(403, "Troque a senha provisória para continuar.", { code: "PASSWORD_CHANGE_REQUIRED" });
    }
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>("roles", [context.getHandler(), context.getClass()]);
    if (allowed && !allowed.includes(auth.user.role)) throw fail(403, "Seu perfil não tem acesso a esta área.");
    request.auth = auth;
    return true;
  }
}
