import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import type { MediaItem, PostItem } from "@hr/shared";
import { PostEditor } from "@/components/portal/content";
import { ConfirmButton } from "@/components/confirm";
import { PageTitle } from "@/components/portal/ui";
import { api } from "@/lib/api";
import { deletePost } from "@/lib/auth/content-actions";
import { apiData, requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Editar notícia" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  await requireContentEditor();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const result = await api<PostItem>(`/content/posts/${id}`);
  if (!result.ok) notFound();
  const post = result.data;
  const media = await apiData<MediaItem[]>("/content/media");
  return (
    <>
      <PageTitle eyebrow="HR NEWS" title="Editar notícia" />
      {post.status === "publicado" && (
        <a href={`/noticias/${post.slug}`} target="_blank" rel="noopener" className="mb-4 inline-flex items-center gap-2 font-bold text-brand-deep underline">
          <ExternalLink className="size-4" aria-hidden /> Ver no site
        </a>
      )}
      <PostEditor post={post} media={media} saved={(await searchParams).salvo === "1"} />
      <form action={deletePost} className="mt-6">
        <input type="hidden" name="id" value={post.id} />
        <ConfirmButton confirm={{ title: "Excluir esta notícia?", message: `“${post.title}” será apagada e sai do site. Não é possível desfazer.`, action: "Excluir notícia" }} className="cursor-pointer rounded-sm border border-red-300 px-6 py-3 text-sm font-extrabold text-red-700 hover:bg-red-600 hover:text-white">Excluir notícia</ConfirmButton>
      </form>
    </>
  );
}
