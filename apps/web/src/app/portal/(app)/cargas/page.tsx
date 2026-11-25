import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { cargoStageKeys, cargoStages, formatDay, type CargoList } from "@hr/shared";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireCargoManager } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Cargas" };

type Props = { searchParams: Promise<{ q?: string | string[]; etapa?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");

export default async function CargoListPage({ searchParams }: Props) {
  await requireCargoManager();
  const params = await searchParams;
  const q = one(params.q);
  const stage = one(params.etapa);
  const { items, total } = await apiData<CargoList>(`/cargo?${new URLSearchParams({ q, stage })}`);
  return (
    <>
      <PageTitle eyebrow="Operação" title="Cargas" />
      <Link href="/portal/cargas/nova" className="mb-6 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-extrabold text-white transition hover:bg-night">
        <Plus className="size-5" aria-hidden /> Nova carga
      </Link>
      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Código, cliente, CNPJ/CPF ou nota" aria-label="Buscar carga" className="min-w-60 flex-1 rounded-sm border border-ink/15 bg-white px-5 py-3 outline-none focus:border-brand" />
        <select name="etapa" defaultValue={stage} aria-label="Filtrar por etapa" className="cursor-pointer rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand">
          <option value="">Todas as etapas</option>
          {cargoStageKeys.map((k) => <option key={k} value={k}>{cargoStages[k]}</option>)}
        </select>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
      </form>
      <Card>
        {items.length === 0 && <p className="text-ink/55">{q || stage ? "Nenhuma carga encontrada com esse filtro." : "Nenhuma carga cadastrada ainda."}</p>}
        <ul className="divide-y divide-ink/10">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/portal/cargas/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 hover:text-brand">
                <strong className="font-mono">{c.code}</strong>
                <span className={`rounded-sm px-3 py-1 text-xs font-extrabold ${c.stage === "ocorrencia" ? "bg-amber-200 text-amber-900" : c.stage === "entregue" ? "bg-ink/10 text-ink/60" : "bg-leaf/40"}`}>{cargoStages[c.stage]}</span>
                <span className="min-w-52 flex-1">
                  <span className="block truncate font-bold">{c.customerName}</span>
                  <span className="block truncate text-sm text-ink/55">{c.origin} → {c.destination}{c.expectedAt && ` · previsão ${formatDay(c.expectedAt)}`}</span>
                </span>
                <span className="text-sm text-ink/55">atualizada em {formatDate(c.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {total > items.length && <p className="mt-4 text-sm text-ink/55">Mostrando as {items.length} atualizadas mais recentemente, de {total}. Use a busca para achar as outras.</p>}
      </Card>
    </>
  );
}
