import type { Metadata } from "next";
import { CargoForm } from "@/components/portal/cargo";
import { PageTitle } from "@/components/portal/ui";
import { requireCargoManager } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova carga" };

export default async function NewCargoPage() {
  await requireCargoManager();
  return (
    <>
      <PageTitle eyebrow="Operação" title="Nova carga" />
      <CargoForm />
    </>
  );
}
