import Link from "next/link";
import { eventLabels, roleLabels, type Dashboard } from "@hr/shared";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";

const TIME_ZONE = "America/Manaus";

const dayKey = (date: Date) => date.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });

type Shortcut = { label: string; href: string; external?: boolean };

export default async function DashboardPage() {
  const { user } = await requireUser();
  const [dashboard, settings] = await Promise.all([apiData<Dashboard>("/dashboard"), getSettings()]);

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const date = now.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));

  // atividades agrupadas por dia, como num livro de registro
  const days: { label: string; entries: { id: number; time: string; text: string }[] }[] = [];
  for (const item of [...dashboard.recent].sort((a, b) => b.at.localeCompare(a.at))) {
    const at = new Date(item.at);
    const key = dayKey(at);
    const label = key === today ? "Hoje" : key === yesterday ? "Ontem" : key;
    if (days.at(-1)?.label !== label) days.push({ label, entries: [] });
    days.at(-1)!.entries.push({ id: item.id, time: at.toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }), text: eventLabels[item.event] ?? item.event });
  }

  const shortcuts: { title: string; items: Shortcut[] }[] = [
    {
      title: "Rastreamento",
      items: [
        { label: "Consultar uma carga", href: "/rastreamento" },
        { label: "Sistema antigo (AMS)", href: settings.trackingUrl, external: true },
      ],
    },
    {
      title: "No site",
      items: [
        { label: "Cotação Online", href: "/cotacao-online" },
        { label: "Unidades e contatos", href: "/onde-estamos" },
        { label: "HR NEWS", href: "/hr-news" },
        { label: "Fale Conosco", href: "/fale-conosco" },
      ],
    },
  ];

  const stats = dashboard.stats;

  return (
    <>
      <PageTitle eyebrow={`${date} · Manaus`} title={`${greeting}, ${user.name.split(" ")[0]}`}>
        {stats && (
          <dl aria-label="Acessos ao portal" className="flex flex-wrap gap-x-10 gap-y-2">
            {[
              { label: "contas ativas", value: stats.activeUsers, alert: false },
              { label: "entradas em 24 h", value: stats.logins24h, alert: false },
              { label: "falhas de login em 24 h", value: stats.failures24h, alert: stats.failures24h > 0 },
            ].map((s) => (
              <div key={s.label} className="flex flex-row-reverse items-baseline gap-2">
                <dt className="text-sm font-semibold text-white/75">{s.label}</dt>
                <dd className={`display text-3xl tabular-nums ${s.alert ? "text-amber-300" : "text-leaf"}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageTitle>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="atividade" className="panel bg-white p-6 sm:p-8">
          <h2 id="atividade" className="display text-2xl uppercase">Sua atividade recente</h2>
          {days.length === 0 && <p className="mt-3 text-sm text-ink/55">Nada registrado ainda.</p>}
          {days.map((day) => (
            <div key={day.label} className="mt-6">
              <h3 className="inline-block bg-night px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest text-white">{day.label}</h3>
              <ol>
                {day.entries.map((entry) => (
                  <li key={entry.id} className="flex items-baseline gap-5 border-b border-ink/10 py-3">
                    <span className="display w-16 shrink-0 text-xl tabular-nums text-brand-deep">{entry.time}</span>
                    <span className="font-semibold">{entry.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="mt-5 text-sm text-ink/55">Não reconhece algo? Troque a senha em <Link href="/portal/perfil" className="font-bold text-brand-deep underline underline-offset-2">Meu perfil</Link>.</p>
        </section>

        <nav aria-label="Atalhos">
          {shortcuts.map((group, i) => (
            <div key={group.title} className={i ? "bg-leaf p-6 text-night" : "bg-night p-6 text-white"}>
              <h2 className="display text-2xl uppercase">{group.title}</h2>
              <ul className="mt-3">
                {group.items.map((item) => (
                  <li key={item.href} className={`border-t ${i ? "border-night/20" : "border-white/15"}`}>
                    <Link href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined} className={`group -mx-6 flex items-center justify-between gap-3 px-6 py-3.5 font-bold transition-colors ${i ? "hover:bg-night hover:text-white" : "hover:bg-brand"}`}>
                      {item.label}
                      <span aria-hidden className="transition-transform group-hover:translate-x-1.5">{item.external ? "↗" : "→"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
