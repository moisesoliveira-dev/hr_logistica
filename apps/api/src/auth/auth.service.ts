import { Injectable, Logger } from "@nestjs/common";
import type { DeviceSession, NewSession } from "@hr/shared";
import { AuditService } from "../common/audit.service.js";
import type { AuthContext, ClientInfo } from "../common/decorators.js";
import { fail } from "../common/errors.js";
import { ThrottleService } from "../common/throttle.service.js";
import { config } from "../config.js";
import { MailService } from "../mail/mail.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ChangePasswordDto, ForgotDto, LoginDto, ResetDto } from "./dto.js";
import { hashPassword, isEmail, newToken, normalizeEmail, passwordProblem, sha256, verifyPassword } from "./password.js";
import { SessionService } from "./session.service.js";

const MINUTE = 60_000;
const INVALID = "E-mail ou senha inválidos.";

@Injectable()
export class AuthService {
  private readonly logger = new Logger("Auth");
  /** usado quando o e-mail não existe, para a resposta levar o mesmo tempo */
  private decoy?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async login(input: LoginDto, client: ClientInfo): Promise<NewSession> {
    const email = normalizeEmail(input.email);
    if (!isEmail(email) || !input.password) throw fail(400, "Informe e-mail e senha válidos.");

    // as tentativas são contadas antes de conferir a senha (impede rajadas simultâneas)
    const perPair = await this.throttle.hit(`login:${email}|${client.ip}`, 15 * MINUTE);
    const perEmail = await this.throttle.hit(`login:${email}`, 15 * MINUTE);
    const perIp = await this.throttle.hit(`login-ip:${client.ip}`, 15 * MINUTE);
    if (perPair > 5 || perEmail > 30 || perIp > 60) {
      if (perPair === 6) await this.audit.log(email, "login_bloqueio", client.ip);
      throw fail(429, "Muitas tentativas. Aguarde 15 minutos ou fale com o administrador.");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    const matches = await verifyPassword(input.password, user?.passwordHash ?? (await (this.decoy ??= hashPassword(newToken()))));
    if (!user || !matches || !user.active) {
      await this.audit.log(email, "login_falha", client.ip);
      throw fail(401, INVALID);
    }
    if (user.mustChangePassword && user.tempExpiresAt && user.tempExpiresAt < new Date()) {
      throw fail(401, "Sua senha provisória expirou. Peça uma nova ao administrador.");
    }

    const session = await this.prisma.$transaction(async (tx) => {
      // trava a conta e confere de novo: ela pode ter sido desativada ou ter a senha trocada nesse meio-tempo
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const fresh = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!fresh.active || fresh.passwordHash !== user.passwordHash) throw fail(401, INVALID);
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return this.sessions.create(user.id, input.remember, client, tx);
    });
    await this.throttle.unlockLogin(email);
    await this.throttle.undo(`login-ip:${client.ip}`);
    await this.audit.log(email, "login", client.ip);
    return { ...session, mustChangePassword: user.mustChangePassword };
  }

  async logout(auth: AuthContext, client: ClientInfo) {
    await this.prisma.session.deleteMany({ where: { id: auth.sessionId } });
    await this.audit.log(auth.user.email, "logout", client.ip);
  }

  async forgot(input: ForgotDto, client: ClientInfo) {
    const email = normalizeEmail(input.email);
    if (!isEmail(email)) throw fail(400, "Informe um e-mail válido.");
    if ((await this.throttle.hit(`reset-ip:${client.ip}`, 60 * MINUTE)) > 10) throw fail(429, "Muitos pedidos. Tente novamente mais tarde.");
    if ((await this.throttle.hit(`reset:${email}`, 60 * MINUTE)) > 3) return;
    // sem "await": o tempo de resposta não revela se a conta existe
    void this.sendResetLink(email, client).catch((error) => this.logger.error("Falha na recuperação de senha", error instanceof Error ? error.stack : String(error)));
  }

  private async sendResetLink(email: string, client: ClientInfo) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.active) return;
    // o endereço vem da configuração, nunca de um cabeçalho da requisição
    const base = config.appUrl || (config.isDev ? "http://localhost:3000" : "");
    if (!base || (!this.mail.configured && !config.isDev)) {
      this.logger.error("Recuperação de senha indisponível: configure APP_URL e SMTP_HOST.");
      return;
    }
    const token = newToken();
    await this.prisma.resetToken.deleteMany({ where: { OR: [{ userId: user.id }, { expiresAt: { lt: new Date() } }] } });
    await this.prisma.resetToken.create({ data: { tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 30 * MINUTE) } });
    await this.audit.log(email, "recuperacao_pedida", client.ip);
    const link = new URL(`/redefinir-senha?token=${token}`, base).toString();
    if (!this.mail.configured) {
      this.logger.log(`[desenvolvimento] Link para redefinir a senha de ${email}: ${link}`);
      return;
    }
    await this.mail.send({
      to: user.email,
      subject: "Redefinição de senha — Portal HR da Amazônia",
      text: `Olá, ${user.name}.\n\nPara criar uma nova senha, acesse (válido por 30 minutos):\n${link}\n\nSe não foi você quem pediu, ignore este e-mail.`,
    });
  }

  private checkNewPassword(password: string, confirm: string, email: string) {
    const problem = passwordProblem(password, email);
    if (problem) throw fail(422, "Revise a nova senha.", { fields: { password: problem } });
    if (password !== confirm) throw fail(422, "Revise a nova senha.", { fields: { confirm: "As senhas não são iguais." } });
  }

  async reset(input: ResetDto, client: ClientInfo) {
    const invalid = () => fail(400, "Este link é inválido ou já expirou. Peça um novo.");
    const tokenHash = sha256(input.token);
    const found = await this.prisma.resetToken.findFirst({ where: { tokenHash, expiresAt: { gt: new Date() } }, include: { user: true } });
    if (!found?.user.active) throw invalid();
    this.checkNewPassword(input.password, input.confirm, found.user.email);
    const passwordHash = await hashPassword(input.password);

    await this.prisma.$transaction(async (tx) => {
      // consome o token de forma atômica: só funciona uma vez
      const consumed = await tx.resetToken.deleteMany({ where: { tokenHash, expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw invalid();
      await tx.user.update({ where: { id: found.userId }, data: { passwordHash, mustChangePassword: false, tempExpiresAt: null } });
      await this.sessions.revokeAll(found.userId, tx);
    });
    await this.throttle.unlockLogin(found.user.email);
    await this.audit.log(found.user.email, "senha_redefinida", client.ip);
  }

  /** Troca a senha, derruba as outras sessões e devolve uma sessão renovada. */
  async changePassword(auth: AuthContext, input: ChangePasswordDto, client: ClientInfo): Promise<NewSession> {
    const { user } = auth;
    if (!user.mustChangePassword) {
      const key = `pwd:${user.id}`;
      if ((await this.throttle.hit(key, 15 * MINUTE)) > 5) throw fail(429, "Muitas tentativas. Aguarde 15 minutos.");
      if (!(await verifyPassword(input.current ?? "", user.passwordHash))) {
        throw fail(422, "Revise os campos.", { fields: { current: "Senha atual incorreta." } });
      }
      await this.throttle.forget(key);
    }
    this.checkNewPassword(input.password, input.confirm, user.email);
    if (await verifyPassword(input.password, user.passwordHash)) {
      throw fail(422, "Revise a nova senha.", { fields: { password: "Escolha uma senha diferente da atual." } });
    }
    const passwordHash = await hashPassword(input.password);
    const session = await this.prisma.$transaction(async (tx) => {
      // só grava se a senha não mudou desde que a sessão foi validada
      const updated = await tx.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash, active: true }, data: { passwordHash, mustChangePassword: false, tempExpiresAt: null } });
      if (updated.count !== 1) throw fail(401, "Sessão expirada. Entre novamente.");
      await this.sessions.revokeAll(user.id, tx);
      return this.sessions.create(user.id, auth.remember, client, tx);
    });
    await this.audit.log(user.email, "senha_alterada", client.ip);
    return { ...session, mustChangePassword: false };
  }

  async listSessions(auth: AuthContext): Promise<DeviceSession[]> {
    const rows = await this.prisma.session.findMany({ where: { userId: auth.user.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
    return rows.map((s) => ({ id: s.id, current: s.id === auth.sessionId, lastSeenAt: s.lastSeenAt.toISOString(), ip: s.ip, userAgent: s.userAgent }));
  }

  /** `id` ausente = encerrar todas as outras. O filtro por userId impede mexer em sessões alheias. */
  async revokeSessions(auth: AuthContext, client: ClientInfo, id?: string) {
    const result = await this.prisma.session.deleteMany({
      where: { userId: auth.user.id, id: id ? { equals: id, not: auth.sessionId } : { not: auth.sessionId } },
    });
    if (result.count) await this.audit.log(auth.user.email, "sessao_encerrada", client.ip);
  }
}
