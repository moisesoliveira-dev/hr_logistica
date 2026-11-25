import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/shell";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Portal do Colaborador", robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  // só o necessário vai para o navegador (nunca o registro inteiro do usuário)
  return <PortalShell user={{ name: user.name, department: user.department, role: user.role }}>{children}</PortalShell>;
}
