import type { MetadataRoute } from "next";
import { services, solutions } from "@/lib/content";
import { listArticles } from "@/lib/news";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await listArticles();
  const pages = ["", "quem-somos", "onde-estamos", "hr-da-amazonia", "nossa-frota", "eficacia", "ambiental", "nossos-servicos", "hr-news", "fale-conosco", "rastreamento", "cotacao-online",
    ...services.map((s) => `servico/${s.slug}`), ...solutions.map((s) => `solucao/${s.slug}`), ...news.map((n) => `noticias/${n.slug}`)];
  return pages.map((p) => ({ url: `https://hr.log.br/${p}` }));
}
