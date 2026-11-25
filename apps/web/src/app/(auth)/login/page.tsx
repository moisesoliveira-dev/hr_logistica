import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";
import { getSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Área do Colaborador", robots: { index: false, follow: false } };

const notices: Record<string, string> = {
  saiu: "Você saiu com segurança.",
  senha: "Senha redefinida. Entre com a nova senha.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; aviso?: string }> }) {
  // com a API fora do ar, a tela de login continua aparecendo
  if (await getSession().catch(() => null)) redirect("/portal");
  const { next, aviso } = await searchParams;
  return (
    <AuthShell title="Bom te ver!" subtitle="Entre com seu e-mail corporativo para acessar o portal.">
      <LoginForm next={safeNext(String(next ?? ""))} notice={aviso && Object.hasOwn(notices, aviso) ? notices[aviso] : undefined} />
    </AuthShell>
  );
}
