import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { ParallaxImage, Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { Pagination } from "@/components/pagination";
import { searchArticles } from "@/lib/news";

export const metadata: Metadata = { title: "HR NEWS" };

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string | string[]; pagina?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");

export default async function HrNews({ searchParams }: Props) {
  const params = await searchParams;
  const q = one(params.q);
  const { items: news, total, page, pageSize } = await searchArticles(q, one(params.pagina));
  return (
    <>
      <PageHero title="HR NEWS" eyebrow="Notícias" image="/fotos/sede-04.jpg" />
      <section className="wrap space-y-10 py-24">
        <form method="get" role="search" className="flex flex-wrap items-center gap-3">
          <input key={q} name="q" type="search" defaultValue={q} maxLength={100} placeholder="Buscar notícia" aria-label="Buscar notícia" className="min-w-56 flex-1 rounded-full border border-ink/15 bg-white px-6 py-4 outline-none transition focus:border-brand" />
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-8 py-4 font-extrabold text-white transition hover:bg-night"><Search className="size-5" aria-hidden /> Buscar</button>
          {q && <Link href="/hr-news" className="px-3 py-2 font-bold text-brand-deep underline underline-offset-4">Limpar busca</Link>}
        </form>
        {news.length === 0 && <p role="status" className="py-10 text-center text-lg text-ink/60">Nenhuma notícia encontrada para “{q}”.</p>}
        {news.map((n) => (
          <Reveal key={n.slug}>
            <Link href={`/noticias/${n.slug}`} className="group grid overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-night/5 md:grid-cols-2">
              <ParallaxImage src={n.image} alt="" className="min-h-72" />
              <span className="flex flex-col justify-center p-8 sm:p-12">
                <span className="eyebrow text-brand-deep">{n.date}</span>
                <h2 className="display mt-4 text-3xl transition-colors group-hover:text-brand sm:text-5xl">{n.title}</h2>
                <span className="mt-4 text-ink/70">{n.excerpt}</span>
                <span className="mt-8 inline-flex items-center gap-2 font-extrabold">Ler matéria <ArrowUpRight className="size-5 transition duration-500 group-hover:rotate-45 group-hover:scale-150" aria-hidden /></span>
              </span>
            </Link>
          </Reveal>
        ))}
        <Pagination page={page} pageSize={pageSize} total={total} unit={["notícia", "notícias"]} path="/hr-news" params={{ q }} />
      </section>
    </>
  );
}
