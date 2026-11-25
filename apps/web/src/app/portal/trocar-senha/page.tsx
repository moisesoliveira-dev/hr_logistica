import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChangePasswordForm } from "@/components/auth/forms";
import { logout } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Primeiro acesso", robots: { index: false, follow: false } };

export default async function FirstAccessPage() {
  const { user } = await requireUser({ allowPendingPassword: true });
  if (!user.mustChangePassword) redirect("/portal/perfil");
  return (
    <AuthShell title="Crie a sua senha" subtitle={`${user.name.split(" ")[0]}, a senha provisória só serve para o primeiro acesso. Escolha uma que só você conheça.`}>
      <ChangePasswordForm firstAccess email={user.email} />
      <form action={logout} className="mt-4 text-center">
        <button type="submit" className="cursor-pointer text-sm font-bold text-ink/60 underline underline-offset-4 hover:text-brand">Sair</button>
      </form>
    </AuthShell>
  );
}
