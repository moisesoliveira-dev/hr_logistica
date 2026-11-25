import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { PostItem } from "@hr/shared";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Notícias" };

export default async function PostsPage() {
  await requireContentEditor();
  const posts = await apiData<PostItem[]>("/content/posts");
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Notícias (HR NEWS)" />
      <Link href="/portal/conteudo/noticias/nova" className="mb-6 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-extrabold text-white transition hover:bg-night">
        <Plus className="size-5" aria-hidden /> Nova notícia
      </Link>
      <Card>
        {posts.length === 0 && <p className="text-ink/55">Nenhuma notícia criada ainda. As notícias antigas do site continuam aparecendo.</p>}
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
    </>
  );
}
