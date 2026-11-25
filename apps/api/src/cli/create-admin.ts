/*
 * Cria o primeiro administrador (ou recupera o acesso de um).
 *   npm run criar-admin -- "Nome Completo" email@hr.log.br [--redefinir]
 *   docker compose exec api node dist/cli/create-admin.js "Nome Completo" email@hr.log.br
 */
import "../config.js";
import { TEMP_PASSWORD_HOURS } from "@hr/shared";
import { isEmail, normalizeEmail } from "../auth/password.js";
import { createClient } from "../prisma/client.js";
import { createUser, provisional } from "../users/create-user.js";

const args = process.argv.slice(2);
const reset = args.includes("--redefinir");
const [name, rawEmail] = args.filter((a) => !a.startsWith("--"));
const email = normalizeEmail(rawEmail ?? "");

if (!name || !isEmail(email)) {
  console.error('Uso: npm run criar-admin -- "Nome Completo" email@empresa.com [--redefinir]');
  process.exit(1);
}

const prisma = createClient();
try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !reset) {
    console.error("Já existe uma conta com esse e-mail. Para recuperar o acesso, acrescente --redefinir.");
    process.exitCode = 1;
  } else {
    let password: string;
    if (existing) {
      const next = await provisional();
      await prisma.user.update({ where: { id: existing.id }, data: { ...next.data, role: "admin", active: true } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.resetToken.deleteMany({ where: { userId: existing.id } });
      await prisma.$executeRaw`DELETE FROM throttle WHERE key = ${`login:${email}`} OR starts_with(key, ${`login:${email}|`})`;
      password = next.password;
    } else {
      password = await createUser(prisma, { name, email, department: "TI", role: "admin" });
    }
    await prisma.auditLog.create({ data: { actor: "terminal", event: existing ? "senha_provisoria" : "usuario_criado", detail: email } });
    console.log(`
Administrador pronto.
  E-mail:           ${email}
  Senha provisória: ${password}

Ela vale por ${TEMP_PASSWORD_HOURS} horas e será trocada no primeiro acesso. Não a compartilhe.
`);
  }
} finally {
  await prisma.$disconnect();
}
