import { Injectable } from "@nestjs/common";
import { pageSizes, roles, searchText, slicePage, type Credential, type Employee, type Paged, type Role } from "@hr/shared";
import { isEmail, normalizeEmail } from "../auth/password.js";
import { SessionService } from "../auth/session.service.js";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { ThrottleService } from "../common/throttle.service.js";
import { Prisma, type User } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { createUser, provisional } from "./create-user.js";
import type { CreateUserDto, ProfileDto } from "./dto.js";

const DUPLICATE = "Já existe uma conta com esse e-mail.";

/** `departments` são os setores que podem ser escolhidos agora. */
function readProfile(input: ProfileDto, departments: string[]) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const role: Role = roles.includes(input.role as Role) ? (input.role as Role) : "colaborador";
  const fields: Record<string, string> = {};
  if (name.length < 3 || name.length > 100) fields.name = "Informe o nome completo.";
  if (!departments.includes(input.department)) fields.department = "Selecione o setor.";
  return { profile: { name, department: input.department, role }, fields };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
  ) {}

  /** Setores ativos e, na edição, o que a conta já tem, mesmo desativado. */
  private async departments(current?: string) {
    const rows = await this.prisma.department.findMany({ where: { active: true }, select: { name: true } });
    return [...rows.map((r) => r.name), ...(current ? [current] : [])];
  }

  async list(query: { q: string; role: string; status: string; page: string }): Promise<Paged<Employee>> {
    const [users, blocked] = await Promise.all([
      this.prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
      this.throttle.blockedLogins(),
    ]);
    const now = new Date();
    // o hash da senha nunca sai da API: apenas os campos abaixo
    const employees: Employee[] = users.map((u) => ({
      id: u.id, name: u.name, email: u.email, department: u.department, role: u.role, active: u.active,
      pending: u.mustChangePassword,
      expired: Boolean(u.mustChangePassword && u.tempExpiresAt && u.tempExpiresAt < now),
      locked: blocked.has(u.email),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    }));
    const wanted = searchText(query.q);
    const statuses: Record<string, (e: Employee) => boolean> = {
      ativas: (e) => e.active,
      desativadas: (e) => !e.active,
      pendentes: (e) => e.active && e.pending,
      bloqueadas: (e) => e.locked,
    };
    const status = Object.hasOwn(statuses, query.status) ? statuses[query.status] : () => true;
    // são as contas da empresa: filtrar aqui permite buscar sem acento e pelo bloqueio de login
    const found = employees.filter((e) => (!query.role || e.role === query.role) && status(e) && searchText(`${e.name} ${e.email} ${e.department}`).includes(wanted));
    return slicePage(found, query.page, pageSizes.usuarios);
  }

  async create(auth: AuthContext, input: CreateUserDto, client: ClientInfo): Promise<Credential> {
    const { profile, fields } = readProfile(input, await this.departments());
    const email = normalizeEmail(input.email);
    if (!isEmail(email)) fields.email = "E-mail inválido.";
    else if (await this.prisma.user.findUnique({ where: { email } })) fields.email = DUPLICATE;
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });

    let password: string;
    try {
      password = await createUser(this.prisma, { ...profile, email });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw fail(422, "Revise os campos.", { fields: { email: DUPLICATE } });
      }
      throw error;
    }
    await this.audit.log(auth.user.email, "usuario_criado", client.ip, email);
    return { email, password };
  }

  /**
   * Toda alteração passa por aqui. A trava faz as ações de administração rodarem uma de cada vez,
   * e como ninguém altera a própria conta, sempre resta ao menos um administrador ativo.
   */
  private async change<T>(auth: AuthContext, targetId: number, work: (tx: Prisma.TransactionClient, target: User) => Promise<T>) {
    if (targetId === auth.user.id) throw fail(400, "Use a página Meu perfil para a sua própria conta.");
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7421)`;
      const actor = await tx.user.findUnique({ where: { id: auth.user.id } });
      if (!actor?.active || actor.role !== "admin") throw fail(403, "Acesso restrito a administradores.");
      const target = await tx.user.findUnique({ where: { id: targetId } });
      if (!target) throw fail(404, "Usuário não encontrado.");
      return { target, result: await work(tx, target) };
    });
  }

  async update(auth: AuthContext, id: number, input: ProfileDto, client: ClientInfo) {
    const current = await this.prisma.user.findUnique({ where: { id }, select: { department: true } });
    const { profile, fields } = readProfile(input, await this.departments(current?.department));
    if (Object.keys(fields).length) throw fail(422, "Revise os campos.", { fields });
    const { target } = await this.change(auth, id, (tx) => tx.user.update({ where: { id }, data: profile }));
    await this.audit.log(auth.user.email, "usuario_editado", client.ip, target.email);
  }

  async setStatus(auth: AuthContext, id: number, active: boolean, client: ClientInfo) {
    const { target } = await this.change(auth, id, async (tx) => {
      await tx.user.update({ where: { id }, data: { active } });
      if (!active) await this.sessions.revokeAll(id, tx);
    });
    await this.audit.log(auth.user.email, active ? "usuario_ativado" : "usuario_desativado", client.ip, target.email);
  }

  async temporaryPassword(auth: AuthContext, id: number, client: ClientInfo): Promise<Credential> {
    const { password, data } = await provisional();
    const { target } = await this.change(auth, id, async (tx) => {
      await tx.user.update({ where: { id }, data });
      await this.sessions.revokeAll(id, tx);
    });
    await this.throttle.unlockLogin(target.email);
    await this.audit.log(auth.user.email, "senha_provisoria", client.ip, target.email);
    return { email: target.email, password };
  }

  async unlock(auth: AuthContext, id: number, client: ClientInfo) {
    const { target } = await this.change(auth, id, async () => undefined);
    await this.throttle.unlockLogin(target.email);
    await this.audit.log(auth.user.email, "usuario_desbloqueado", client.ip, target.email);
  }
}
