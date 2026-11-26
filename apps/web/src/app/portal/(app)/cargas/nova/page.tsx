import type { Metadata } from "next";
import type { CargoOptions } from "@hr/shared";
import { CargoForm } from "@/components/portal/cargo";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireCargoManager } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova carga" };

export default async function NewCargoPage() {
  await requireCargoManager();
  const options = await apiData<CargoOptions>("/options/cargo");
  return (
    <>
      <PageTitle eyebrow="Operação" title="Nova carga" />
      <CargoForm options={options} />
    </>
  );
}
