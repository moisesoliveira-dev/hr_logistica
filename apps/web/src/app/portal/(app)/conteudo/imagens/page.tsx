import type { Metadata } from "next";
import { Search } from "lucide-react";
import type { MediaItem, Paged } from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { ImageLibrary, ImageUploader } from "@/components/portal/content";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Imagens" };

type Props = { searchParams: Promise<{ q?: string | string[]; pagina?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");

export default async function ImagesPage({ searchParams }: Props) {
  await requireContentEditor();
  const params = await searchParams;
  const q = one(params.q);
  const { items, total, page, pageSize } = await apiData<Paged<MediaItem>>(`/content/media?${new URLSearchParams({ q, page: one(params.pagina) })}`);
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Imagens" />
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <ImageUploader />
        <div className="min-w-0 space-y-4">
          <form method="get" className="flex flex-wrap gap-3">
            <input name="q" type="search" defaultValue={q} placeholder="Descrição ou nome do arquivo" aria-label="Buscar imagem" className="min-w-52 flex-1 rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand" />
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
          </form>
          <ImageLibrary items={items} emptyText={q ? "Nenhuma imagem encontrada." : "Nenhuma imagem enviada ainda."} />
          <Pagination page={page} pageSize={pageSize} total={total} unit={["imagem", "imagens"]} path="/portal/conteudo/imagens" params={{ q }} />
        </div>
      </div>
    </>
  );
}
