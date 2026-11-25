import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui";
import { findArticle } from "@/lib/news";

type Props = { params: Promise<{ slug: string }> };

// lido a cada acesso: uma notícia publicada aparece na hora
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findArticle((await params).slug);
  return { title: post?.title, description: post?.excerpt };
}

export default async function Article({ params }: Props) {
  const post = await findArticle((await params).slug);
  if (!post) notFound();
  return (
    <>
      <PageHero title={post.title} eyebrow="HR NEWS" image={post.image} intro={`Por HR da Amazônia${post.date ? ` · ${post.date}` : ""}`} />
      <article className="wrap max-w-3xl py-20">
        {post.body.map((p, i) => (
          <Reveal key={i}><p className="mb-6 whitespace-pre-line text-lg leading-relaxed">{p}</p></Reveal>
        ))}
        {post.source && (
          <p className="mb-10 break-words text-sm text-ink/60">Fonte: <a href={post.source} target="_blank" rel="noopener noreferrer" className="underline">{post.source}</a></p>
        )}
        <Button href="/hr-news">Voltar às notícias</Button>
      </article>
    </>
  );
}
