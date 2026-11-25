import type { Metadata } from "next";
import { eventLabels, type AuditEntry } from "@hr/shared";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Atividades" };

const alerts = new Set(["login_falha", "login_bloqueio", "usuario_desativado"]);

export default async function AuditPage() {
  await requireAdmin();
  const rows = await apiData<AuditEntry[]>("/audit");
  return (
    <>
      <PageTitle eyebrow="Administração" title="Atividades" />
      <Card>
        <p className="text-sm text-ink/55">Últimos 200 registros, no horário de Manaus.</p>
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
    </>
  );
}
