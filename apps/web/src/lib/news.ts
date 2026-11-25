import "server-only";
import type { PostItem } from "@hr/shared";
import { api } from "./api";
import { news as legacy } from "./content";

export type Article = { slug: string; title: string; excerpt: string; date: string; image: string; body: string[]; source?: string };

const dateFormat = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Manaus" });

const fromPost = (p: PostItem): Article => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  date: p.publishedAt ? dateFormat(p.publishedAt) : "",
  image: p.coverId ? `/midia/${p.coverId}` : "/fotos/sede-04.jpg",
  body: p.body.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean),
});

/** Notícias publicadas pelo marketing, seguidas das antigas do site. Se a API cair, mostra só as antigas. */
export async function listArticles(): Promise<Article[]> {
  const result = await api<PostItem[]>("/public/posts");
  const posts = result.ok ? result.data.map(fromPost) : [];
  const taken = new Set(posts.map((p) => p.slug));
  return [...posts, ...legacy.filter((n) => !taken.has(n.slug))];
}

export async function findArticle(slug: string): Promise<Article | null> {
  if (/^[a-z0-9-]{1,160}$/.test(slug)) {
    const result = await api<PostItem>(`/public/posts/${slug}`);
    if (result.ok) return fromPost(result.data);
  }
  return legacy.find((n) => n.slug === slug) ?? null;
}
