import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ParallaxImage, Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { listArticles } from "@/lib/news";

export const metadata: Metadata = { title: "HR NEWS" };

export const dynamic = "force-dynamic";

export default async function HrNews() {
  const news = await listArticles();
  return (
    <>
      <PageHero title="HR NEWS" eyebrow="Notícias" image="/fotos/sede-04.jpg" />
      <section className="wrap space-y-10 py-24">
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
      </section>
    </>
  );
}
