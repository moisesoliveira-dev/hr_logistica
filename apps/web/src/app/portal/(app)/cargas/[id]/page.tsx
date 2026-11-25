import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CargoDetail } from "@hr/shared";
import { CargoEventForm, CargoForm, CargoHistory, DeleteCargo, ShareCode } from "@/components/portal/cargo";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireCargoManager } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Carga" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nova?: string }> };

export default async function CargoPage({ params, searchParams }: Props) {
  await requireCargoManager();
  const [{ id }, { nova }] = await Promise.all([params, searchParams]);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const cargo = await apiData<CargoDetail>(`/cargo/${id}`);
  return (
    <>
      <PageTitle eyebrow={cargo.customerName} title={cargo.code} />
      <Link href="/portal/cargas" className="mb-5 flex w-fit items-center gap-1 text-sm font-bold hover:text-brand"><ArrowLeft className="size-4" aria-hidden /> Todas as cargas</Link>
      {nova && <p role="status" className="mb-4 rounded-sm bg-leaf/30 p-4 font-bold">Carga cadastrada. Envie o código ao cliente.</p>}
      <div className="mb-6"><ShareCode code={cargo.code} /></div>
      <div className="space-y-6">
        <CargoEventForm key={cargo.id} cargo={cargo} />
        <CargoHistory cargoId={cargo.id} events={cargo.events} />
        <CargoForm cargo={cargo} />
        <DeleteCargo id={cargo.id} code={cargo.code} />
      </div>
    </>
  );
}
