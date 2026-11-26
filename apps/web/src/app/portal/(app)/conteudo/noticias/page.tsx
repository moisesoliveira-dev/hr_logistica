import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { Paged, PostSummary } from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Notícias" };

type Props = { searchParams: Promise<{ q?: string | string[]; situacao?: string | string[]; pagina?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");
const control = "rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand";

export default async function PostsPage({ searchParams }: Props) {
  await requireContentEditor();
  const params = await searchParams;
  const q = one(params.q);
  const status = one(params.situacao);
  const { items: posts, total, page, pageSize } = await apiData<Paged<PostSummary>>(`/content/posts?${new URLSearchParams({ q, status, page: one(params.pagina) })}`);
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Notícias (HR NEWS)" />
      <Link href="/portal/conteudo/noticias/nova" className="mb-6 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-extrabold text-white transition hover:bg-night">
        <Plus className="size-5" aria-hidden /> Nova notícia
      </Link>
      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input name="q" type="search" defaultValue={q} placeholder="Título ou resumo" aria-label="Buscar notícia" className={`${control} min-w-60 flex-1`} />
        <select key={status} name="situacao" defaultValue={status} aria-label="Filtrar por situação" className={`${control} cursor-pointer`}>
          <option value="">Todas</option>
          <option value="publicado">No ar</option>
          <option value="rascunho">Rascunhos</option>
        </select>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
      </form>
      <Card>
        {posts.length === 0 && <p className="text-ink/55">{q || status ? "Nenhuma notícia encontrada com esse filtro." : "Nenhuma notícia criada ainda. As notícias antigas do site continuam aparecendo."}</p>}
        <ul className="divide-y divide-ink/10">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/portal/conteudo/noticias/${p.id}`} className="flex flex-wrap items-center gap-3 py-4 hover:text-brand">
                <span className={`rounded-sm px-3 py-1 text-xs font-extrabold ${p.status === "publicado" ? "bg-leaf/40" : "bg-ink/10 text-ink/60"}`}>{p.status === "publicado" ? "No ar" : "Rascunho"}</span>
                <strong className="min-w-0 flex-1 truncate">{p.title}</strong>
                <span className="text-sm text-ink/55">editada em {formatDate(p.updatedAt)} por {p.updatedBy}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Pagination page={page} pageSize={pageSize} total={total} unit={["notícia", "notícias"]} path="/portal/conteudo/noticias" params={{ q, situacao: status }} />
    </>
  );
}
