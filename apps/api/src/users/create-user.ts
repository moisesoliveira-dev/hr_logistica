/* Usado pela API e pelo comando de linha que cria o primeiro administrador. */
import { TEMP_PASSWORD_HOURS, type Role } from "@hr/shared";
import { hashPassword, normalizeEmail, temporaryPassword } from "../auth/password.js";
import type { Prisma } from "../generated/prisma/client.js";

export async function provisional() {
  const password = temporaryPassword();
  return {
    password,
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, tempExpiresAt: new Date(Date.now() + TEMP_PASSWORD_HOURS * 3_600_000) },
  };
}

/** Cria a conta já com senha provisória, que precisa ser trocada no primeiro acesso. */
export async function createUser(db: Prisma.TransactionClient, input: { name: string; email: string; department: string; role: Role }) {
  const { password, data } = await provisional();
  await db.user.create({ data: { ...input, email: normalizeEmail(input.email), ...data } });
  return password;
}
