import Link from "next/link";
import { eventLabels, formatDay, type Dashboard } from "@hr/shared";
import { DayColumns, StageBars } from "@/components/portal/charts";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";
import { getSettings } from "@/lib/settings";

const TIME_ZONE = "America/Manaus";

const dayKey = (date: Date) => date.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });

function Panel({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={`panel min-w-0 bg-white p-5 sm:p-6 ${className}`}>
      <h2 className="display mb-4 text-xl uppercase">{title}</h2>
      {children}
    </section>
  );
}

type Figure = { label: string; value: number; href?: string; alert?: boolean };

/** Faixa escura de números: um bloco só, dividido por linhas. */
function Figures({ title, items }: { title: string; items: Figure[] }) {
  return (
    <section aria-label={title} className="bg-night text-white">
      <h2 className="border-b border-white/10 px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-leaf sm:px-6">{title}</h2>
      <ul className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
        {items.map((item) => {
          const warn = item.alert && item.value > 0;
          const body = (
            <>
              <span className={`display block text-5xl tabular-nums ${warn ? "text-amber-300" : "text-white"}`}>{item.value}</span>
              <span className={`mt-1 block text-sm font-semibold ${warn ? "text-amber-300" : "text-white/70"}`}>{warn ? "⚠ " : ""}{item.label}</span>
            </>
          );
          return (
            <li key={item.label} className="bg-night" data-figure={item.label}>
              {item.href ? <Link href={item.href} className="block h-full px-5 py-5 transition-colors hover:bg-brand-deep sm:px-6">{body}</Link> : <div className="h-full px-5 py-5 sm:px-6">{body}</div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function DashboardPage() {
  const { user } = await requireUser();
  const [{ recent, stats, cargo, content }, settings] = await Promise.all([apiData<Dashboard>("/dashboard"), getSettings()]);

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const date = now.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
  const today = dayKey(now);

  const links = [
    { label: "Consultar uma carga", href: "/rastreamento" },
    { label: "Rastreamento antigo (AMS)", href: settings.trackingUrl, external: true },
    { label: "Cotação Online", href: "/cotacao-online" },
    { label: "Unidades e contatos", href: "/onde-estamos" },
    { label: "HR NEWS", href: "/hr-news" },
    { label: "Fale Conosco", href: "/fale-conosco" },
  ];

  return (
    <>
      <PageTitle eyebrow={`${date} · Manaus`} title={`${greeting}, ${user.name.split(" ")[0]}`} />

      <div className="space-y-6">
        {cargo && (
          <>
            <Figures title="Cargas agora" items={[
              { label: "em andamento", value: cargo.open, href: "/portal/cargas" },
              { label: "com ocorrência", value: cargo.occurrences, href: "/portal/cargas?etapa=_ocorrencias", alert: true },
              { label: "com previsão vencida", value: cargo.late, alert: true },
              { label: "entregues em 7 dias", value: cargo.deliveredWeek },
            ]} />
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Cargas por etapa"><StageBars stages={cargo.stages} /></Panel>
              <Panel title="Entregas nos últimos 14 dias"><DayColumns data={cargo.deliveries} unit={["entrega", "entregas"]} label="Entregas por dia nos últimos 14 dias" /></Panel>
            </div>
            <Panel title="Precisam de atenção">
              {cargo.attention.length === 0 && <p className="text-ink/60">Nenhuma carga com ocorrência ou previsão vencida.</p>}
              <ul className="divide-y divide-ink/10">
                {cargo.attention.map((c) => (
                  <li key={c.id}>
                    <Link href={`/portal/cargas/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-paper">
                      <strong className="font-mono">{c.code}</strong>
                      <span className="min-w-40 flex-1 truncate font-semibold">{c.customerName}</span>
                      {c.stage.kind === "ocorrencia" && <span className="bg-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">⚠ {c.stage.name}</span>}
                      {c.late && <span className="bg-red-100 px-2.5 py-0.5 text-xs font-extrabold text-red-800">Previsão {formatDay(c.expectedAt)} vencida</span>}
                      {c.stage.kind !== "ocorrencia" && <span className="text-sm text-ink/55">{c.stage.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {cargo.attention.length === 6 && <p className="mt-3 text-sm text-ink/55">Mostrando as 6 primeiras.</p>}
            </Panel>
          </>
        )}

        {content && (
          <>
            <Figures title="Conteúdo do site" items={[
              { label: "notícias no ar", value: content.published, href: "/portal/conteudo/noticias" },
              { label: "rascunhos", value: content.drafts, href: "/portal/conteudo/noticias" },
              { label: "imagens no acervo", value: content.images, href: "/portal/conteudo/imagens" },
              { label: "itens visíveis no site", value: content.siteItems, href: "/portal/conteudo/site" },
            ]} />
            <Panel title="Últimas notícias editadas">
              {content.latest.length === 0 && <p className="text-ink/60">Nenhuma notícia criada no portal ainda.</p>}
              <ul className="divide-y divide-ink/10">
                {content.latest.map((post) => (
                  <li key={post.id}>
                    <Link href={`/portal/conteudo/noticias/${post.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-paper">
                      <span className={`px-2.5 py-0.5 text-xs font-extrabold ${post.status === "publicado" ? "bg-leaf/40" : "bg-ink/10 text-ink/60"}`}>{post.status === "publicado" ? "No ar" : "Rascunho"}</span>
                      <strong className="min-w-40 flex-1 truncate">{post.title}</strong>
                      <span className="text-sm text-ink/55">{formatDate(post.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {stats && (
            <Panel title="Acessos ao portal">
              <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <div className="flex flex-row-reverse items-baseline gap-1.5"><dt className="text-ink/65">contas ativas</dt><dd className="text-xl font-extrabold tabular-nums">{stats.activeUsers}</dd></div>
                <div className={`flex flex-row-reverse items-baseline gap-1.5 ${stats.failures24h ? "text-red-700" : ""}`}><dt className={stats.failures24h ? "font-semibold" : "text-ink/65"}>falhas de login em 24 h</dt><dd className="text-xl font-extrabold tabular-nums">{stats.failures24h}</dd></div>
              </dl>
              <DayColumns data={stats.logins} unit={["entrada", "entradas"]} label="Entradas no portal nos últimos 7 dias" />
            </Panel>
          )}

          <Panel title="Sua atividade recente" className={stats ? "" : "lg:col-span-2"}>
            {recent.length === 0 && <p className="text-ink/60">Nada registrado ainda.</p>}
            <ol className="divide-y divide-ink/10">
              {[...recent].sort((a, b) => b.at.localeCompare(a.at)).map((item) => {
                const at = new Date(item.at);
                return (
                  <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
                    <span className="font-semibold">{eventLabels[item.event] ?? item.event}</span>
                    <time dateTime={item.at} className="text-sm tabular-nums text-ink/55">{dayKey(at) === today ? "hoje" : dayKey(at)}, {at.toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" })}</time>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-sm text-ink/55">Não reconhece algo? Troque a senha em <Link href="/portal/perfil" className="font-bold text-brand-deep underline underline-offset-2">Meu perfil</Link>.</p>
          </Panel>
        </div>

        <nav aria-label="Atalhos" className="bg-leaf text-night">
          <ul className="grid gap-px bg-night/15 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((item) => (
              <li key={item.href} className="bg-leaf">
                <Link href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined} className="group flex items-center justify-between gap-3 px-5 py-4 font-bold transition-colors hover:bg-night hover:text-white">
                  {item.label}
                  <span aria-hidden className="transition-transform group-hover:translate-x-1.5">{item.external ? "↗" : "→"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
