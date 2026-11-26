/* Gráficos do painel: HTML puro, uma série por gráfico, no verde da marca. */
import Link from "next/link";
import { formatDay, type CargoOverview, type DayCount } from "@hr/shared";

const shortDay = (day: string) => formatDay(day).slice(0, 5);
const weekday = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "");

/** Colunas por dia. O valor aparece ao passar o mouse ou focar; o maior fica sempre rotulado. */
export function DayColumns({ data, unit, label }: { data: DayCount[]; unit: [string, string]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const peak = data.findLastIndex((d) => d.count === max);
  const total = data.reduce((n, d) => n + d.count, 0);
  const words = (n: number) => `${n} ${n === 1 ? unit[0] : unit[1]}`;
  const axis = (i: number) => (data.length <= 7 ? weekday(data[i].day) : i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? shortDay(data[i].day) : "");
  return (
    <figure aria-label={label}>
      <p className="text-sm text-ink/60">{total ? `${words(total)} no período` : "Nada no período ainda."}</p>
      <ol className="mt-6 flex h-36 items-end gap-[2px] border-b border-ink/25" aria-hidden>
        {data.map((d, i) => (
          <li key={d.day} tabIndex={0} className="group relative flex h-full flex-1 items-end justify-center outline-none">
            <span className="absolute inset-0 group-hover:bg-ink/5 group-focus-visible:bg-ink/5" />
            <span className="relative w-full max-w-6 rounded-t-[4px] bg-brand transition-colors group-hover:bg-brand-deep" style={{ height: d.count ? `${Math.max((d.count / max) * 100, 4)}%` : 0 }}>
              {i === peak && total > 0 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold tabular-nums text-ink group-hover:hidden group-focus-visible:hidden">{d.count}</span>}
            </span>
            <span className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap bg-night px-2.5 py-1.5 text-xs font-semibold text-white group-hover:block group-focus-visible:block ${i < 2 ? "left-0" : i > data.length - 3 ? "right-0" : ""}`}>
              {shortDay(d.day)}: {words(d.count)}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-1.5 flex gap-[2px] text-[11px] font-semibold text-ink/55" aria-hidden>
        {data.map((d, i) => (
          <span key={d.day} className={`flex flex-1 whitespace-nowrap ${data.length > 7 && i === 0 ? "justify-start" : data.length > 7 && i === data.length - 1 ? "justify-end" : "justify-center"}`}>{axis(i)}</span>
        ))}
      </div>
      {/* os mesmos números em tabela, para leitores de tela */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th>Dia</th><th>{unit[1]}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><td>{formatDay(d.day)}</td><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Quantas cargas há em cada etapa. Cada linha leva à lista já filtrada. */
export function StageBars({ stages }: { stages: CargoOverview["stages"] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <ul>
      {stages.map(({ stage, count }, i) => {
        const problem = stage.kind === "ocorrencia";
        // uma linha separa o caminho normal das ocorrências
        const first = problem && stages[i - 1]?.stage.kind !== "ocorrencia";
        return (
          <li key={stage.key} className={first ? "mt-2 border-t border-ink/15 pt-2" : ""}>
            <Link href={`/portal/cargas?etapa=${stage.key}`} data-stage={stage.key} className="group grid grid-cols-[minmax(0,11rem)_1fr_2.5rem] items-center gap-3 py-1.5 hover:bg-paper sm:grid-cols-[minmax(0,15rem)_1fr_2.5rem]">
              <span className="text-sm font-semibold leading-tight">{problem ? "⚠ " : ""}{stage.name}</span>
              <span className="block h-4" aria-hidden>
                <span className={`block h-full rounded-r-[4px] ${problem ? "bg-amber-500" : "bg-brand group-hover:bg-brand-deep"}`} style={{ width: count ? `${Math.max((count / max) * 100, 2)}%` : 0 }} />
              </span>
              <span className={`text-right text-sm font-bold tabular-nums ${count ? "" : "text-ink/35"}`}>{count}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
