import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  /** nome do que está sendo contado: ["carga", "cargas"] */
  unit: [string, string];
} & (
  | { /** endereço sem a página, com os filtros atuais */ path: string; params?: Record<string, string>; onPage?: never }
  | { /** para listas que mudam sem trocar de endereço */ onPage: (page: number) => void; path?: never; params?: never }
);

/** Primeira, última, a atual e as vizinhas; "…" no lugar do que ficou de fora. */
function visiblePages(page: number, pages: number): (number | "…")[] {
  const wanted = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return wanted.flatMap((n, i) => {
    const gap = n - (wanted[i - 1] ?? 0);
    // um buraco de um número só mostra o próprio número
    return gap === 2 ? [n - 1, n] : gap > 2 ? ["…" as const, n] : [n];
  });
}

const box = "grid h-10 min-w-10 place-items-center rounded-lg border px-2 text-sm font-extrabold tabular-nums transition-colors";
const idle = `${box} cursor-pointer border-ink/15 bg-white hover:border-brand hover:text-brand-deep`;

export function Pagination({ page, pageSize, total, unit, ...rest }: Props) {
  if (total === 0) return null;
  const pages = Math.ceil(total / pageSize);
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const href = (target: number) => {
    const params = new URLSearchParams(Object.entries(rest.params ?? {}).filter(([, value]) => value));
    if (target > 1) params.set("pagina", String(target));
    return params.size ? `${rest.path}?${params}` : rest.path!;
  };

  const go = (target: number, children: React.ReactNode, label: string) =>
    rest.onPage
      ? <button type="button" onClick={() => rest.onPage(target)} aria-label={label} className={idle}>{children}</button>
      : <Link href={href(target)} aria-label={label} className={idle}>{children}</Link>;

  const arrow = (target: number, label: string, icon: React.ReactNode) =>
    target >= 1 && target <= pages ? go(target, icon, label) : <span aria-hidden className={`${box} border-ink/10 text-ink/25`}>{icon}</span>;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink/60" aria-live="polite">
        {pages > 1 ? `${first}–${last} de ${total} ${unit[1]}` : `${total} ${total === 1 ? unit[0] : unit[1]}`}
      </p>
      {pages > 1 && (
        <nav aria-label={`Páginas de ${unit[1]}`}>
          <ul className="flex flex-wrap items-center gap-1.5">
            <li>{arrow(page - 1, "Página anterior", <ChevronLeft className="size-4" aria-hidden />)}</li>
            {visiblePages(page, pages).map((n, i) => (
              <li key={n === "…" ? `corte-${i}` : n}>
                {n === "…" ? <span className="px-1 text-ink/50">…</span>
                  : n === page ? <span aria-current="page" className={`${box} border-night bg-night text-white`}>{n}</span>
                  : go(n, n, `Página ${n}`)}
              </li>
            ))}
            <li>{arrow(page + 1, "Próxima página", <ChevronRight className="size-4" aria-hidden />)}</li>
          </ul>
        </nav>
      )}
    </div>
  );
}
