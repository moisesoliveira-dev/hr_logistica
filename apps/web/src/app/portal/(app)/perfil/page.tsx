import { Monitor, Smartphone } from "lucide-react";
import { roleLabels, type DeviceSession } from "@hr/shared";
import { ChangePasswordForm } from "@/components/auth/forms";
import { Card, PageTitle } from "@/components/portal/ui";
import { revokeSession } from "@/lib/auth/actions";
import { apiData, requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

function describe(agent: string) {
  const browser = /Edg\//.test(agent) ? "Edge" : /OPR\//.test(agent) ? "Opera" : /Firefox\//.test(agent) ? "Firefox" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Navegador";
  const system = /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Windows/.test(agent) ? "Windows" : /Mac OS/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "sistema desconhecido";
  return { name: `${browser} no ${system}`, mobile: /Android|iPhone|iPad/.test(agent) };
}

export default async function ProfilePage() {
  const { user } = await requireUser();
  const sessions = await apiData<DeviceSession[]>("/auth/sessions");
  return (
    <>
      <PageTitle eyebrow="Conta" title="Meu perfil" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <dl className="space-y-3">
              {[["Nome", user.name], ["E-mail", user.email], ["Setor", user.department], ["Perfil", roleLabels[user.role]], ["Conta criada em", formatDate(user.createdAt)]].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink/50">{term}</dt>
                  <dd className="break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-ink/55">Para corrigir esses dados, fale com um administrador.</p>
          </Card>
          <Card delay={0.1}>
            <h2 className="text-2xl font-extrabold">Onde você está conectado</h2>
            <ul className="mt-4 space-y-3">
              {sessions.map((s) => {
                const device = describe(s.userAgent);
                const Icon = device.mobile ? Smartphone : Monitor;
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-sm bg-paper p-3">
                    <Icon className="size-6 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <strong className="block">{device.name}</strong>
                      <span className="text-xs text-ink/55">IP {s.ip} · ativo em {formatDate(s.lastSeenAt)}</span>
                    </span>
                    {s.current ? (
                      <span className="rounded-sm bg-leaf/40 px-3 py-1 text-xs font-extrabold">Este aparelho</span>
                    ) : (
                      <form action={revokeSession}>
                        <input type="hidden" name="sessionId" value={s.id} />
                        <button className="cursor-pointer rounded-sm border border-red-300 px-3 py-1 text-xs font-extrabold text-red-700 hover:bg-red-600 hover:text-white">Encerrar</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
            {sessions.length > 1 && (
              <form action={revokeSession} className="mt-4">
                <input type="hidden" name="sessionId" value="outras" />
                <button className="w-full cursor-pointer rounded-sm bg-night py-3 text-sm font-extrabold text-white hover:bg-red-700">Encerrar todas as outras</button>
              </form>
            )}
          </Card>
        </div>
        <Card delay={0.18}>
          <h2 className="mb-4 text-2xl font-extrabold">Alterar senha</h2>
          <ChangePasswordForm firstAccess={false} email={user.email} />
        </Card>
      </div>
    </>
  );
}
