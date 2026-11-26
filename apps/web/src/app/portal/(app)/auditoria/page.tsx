import type { Metadata } from "next";
import { Search } from "lucide-react";
import { eventLabels, type AuditEntry, type Paged } from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Atividades" };

const alerts = new Set(["login_falha", "login_bloqueio", "usuario_desativado"]);

type Props = { searchParams: Promise<{ q?: string | string[]; acao?: string | string[]; pagina?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");
const control = "rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand";

export default async function AuditPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q);
  const event = one(params.acao);
  const { items: rows, total, page, pageSize } = await apiData<Paged<AuditEntry>>(`/audit?${new URLSearchParams({ q, event, page: one(params.pagina) })}`);
  return (
    <>
      <PageTitle eyebrow="Administração" title="Atividades" />
      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input name="q" type="search" defaultValue={q} placeholder="E-mail, código da carga, nome ou IP" aria-label="Buscar nas atividades" className={`${control} min-w-60 flex-1`} />
        <select key={event} name="acao" defaultValue={event} aria-label="Filtrar por ação" className={`${control} max-w-full cursor-pointer`}>
          <option value="">Todas as ações</option>
          {Object.entries(eventLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
      </form>
      <Card>
        <p className="text-sm text-ink/55">Do mais recente ao mais antigo, no horário de Manaus.</p>
        {rows.length === 0 && <p className="mt-3 text-ink/55">Nenhum registro com esse filtro.</p>}
        <ul className="mt-3 divide-y divide-ink/10">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-4">
              <time className="text-sm tabular-nums text-ink/55">{formatDate(r.at)}</time>
              <span className="min-w-0">
                <strong className={`block ${alerts.has(r.event) ? "text-red-700" : ""}`}>{eventLabels[r.event] ?? r.event}</strong>
                <span className="block break-all text-sm text-ink/65">{r.actor}{r.detail ? ` → ${r.detail}` : ""}</span>
              </span>
              <span className="text-xs text-ink/45">{r.ip}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Pagination page={page} pageSize={pageSize} total={total} unit={["registro", "registros"]} path="/portal/auditoria" params={{ q, acao: event }} />
    </>
  );
}
