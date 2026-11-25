import { createParamDecorator, SetMetadata, type ExecutionContext } from "@nestjs/common";
import type { Role } from "@hr/shared";
import type { Request } from "express";
import type { User } from "../generated/prisma/client.js";

/** Rota que não exige sessão. Sem isto, toda rota exige login. */
export const Public = () => SetMetadata("public", true);
/** Rota que dispensa a chave interna (apenas a verificação de saúde). */
export const NoInternalKey = () => SetMetadata("noInternalKey", true);
export const AllowPendingPassword = () => SetMetadata("allowPendingPassword", true);
/** Perfis que podem usar a rota. Sem isto, qualquer funcionário logado pode. */
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
export const AdminOnly = () => Roles("admin");

export type AuthContext = { sessionId: string; remember: boolean; tokenHash: string; user: User };
export type AuthedRequest = Request & { auth?: AuthContext };

export const Auth = createParamDecorator((_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().auth);

export type ClientInfo = { ip: string; userAgent: string };

/** Dados do visitante, repassados pelo site (confiáveis porque a chave interna já foi conferida). */
export const Client = createParamDecorator((_: unknown, context: ExecutionContext): ClientInfo => {
  const request = context.switchToHttp().getRequest<Request>();
  return {
    ip: String(request.headers["x-client-ip"] ?? "local").slice(0, 60),
    userAgent: String(request.headers["x-client-agent"] ?? "").slice(0, 300),
  };
});
