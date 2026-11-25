import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Crie uma nova senha" subtitle="Ao salvar, todos os aparelhos conectados à sua conta serão desconectados.">
      <ResetForm token={String(token ?? "")} />
    </AuthShell>
  );
}
