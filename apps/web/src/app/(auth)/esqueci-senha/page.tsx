import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Esqueceu a senha?" subtitle="Informe seu e-mail corporativo e enviaremos um link para criar outra.">
      <ForgotForm />
    </AuthShell>
  );
}
