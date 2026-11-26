import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { formatDay, type CargoList, type CargoOptions, type StageRef } from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireCargoManager } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Cargas" };

type Props = { searchParams: Promise<{ q?: string | string[]; etapa?: string | string[]; transporte?: string | string[]; pagina?: string | string[] }> };

const tone = (stage: StageRef) => (stage.kind === "ocorrencia" ? "bg-amber-200 text-amber-900" : stage.kind === "entrega" ? "bg-ink/10 text-ink/60" : "bg-leaf/40");
const select = "cursor-pointer rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand";

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");

export default async function CargoListPage({ searchParams }: Props) {
  await requireCargoManager();
  const params = await searchParams;
  const q = one(params.q);
  const stage = one(params.etapa);
  const mode = one(params.transporte);
  const [{ items, total, page, pageSize }, options] = await Promise.all([
    apiData<CargoList>(`/cargo?${new URLSearchParams({ q, stage, mode, page: one(params.pagina) })}`),
    apiData<CargoOptions>("/options/cargo"),
  ]);
  const filtered = Boolean(q || stage || mode);
  return (
    <>
      <PageTitle eyebrow="Operação" title="Cargas" />
      <Link href="/portal/cargas/nova" className="mb-6 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-extrabold text-white transition hover:bg-night">
        <Plus className="size-5" aria-hidden /> Nova carga
      </Link>
      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Código, cliente, CNPJ/CPF, nota ou cidade" aria-label="Buscar carga" className="min-w-60 flex-1 rounded-sm border border-ink/15 bg-white px-5 py-3 outline-none focus:border-brand" />
        {/* a chave faz as listas voltarem ao filtro atual quando se chega por um link */}
        <select key={`etapa-${stage}`} name="etapa" defaultValue={stage} aria-label="Filtrar por etapa" className={`${select} max-w-full`}>
          <option value="">Todas as etapas</option>
          <option value="_ocorrencias">Todas as ocorrências</option>
          {options.stages.map((s) => <option key={s.key} value={s.key}>{s.name}{s.active ? "" : " (desativada)"}</option>)}
        </select>
        <select key={`transporte-${mode}`} name="transporte" defaultValue={mode} aria-label="Filtrar por transporte" className={select}>
          <option value="">Todos os transportes</option>
          {options.modes.map((m) => <option key={m.key} value={m.key}>{m.name}{m.active ? "" : " (desativado)"}</option>)}
        </select>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
      </form>
      <Card>
        {items.length === 0 && <p className="text-ink/55">{filtered ? "Nenhuma carga encontrada com esse filtro." : "Nenhuma carga cadastrada ainda."}</p>}
        <ul className="divide-y divide-ink/10">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/portal/cargas/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 hover:text-brand">
                <strong className="font-mono">{c.code}</strong>
                <span className={`rounded-sm px-3 py-1 text-xs font-extrabold ${tone(c.stage)}`}>{c.stage.name}</span>
                <span className="min-w-52 flex-1">
                  <span className="block truncate font-bold">{c.customerName}</span>
                  <span className="block truncate text-sm text-ink/55">{c.origin} → {c.destination}{c.expectedAt && ` · previsão ${formatDay(c.expectedAt)}`}</span>
                </span>
                <span className="text-sm text-ink/55">atualizada em {formatDate(c.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Pagination page={page} pageSize={pageSize} total={total} unit={["carga", "cargas"]} path="/portal/cargas" params={{ q, etapa: stage, transporte: mode }} />
    </>
  );
}
