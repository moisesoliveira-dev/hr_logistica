import type { Metadata } from "next";
import type { MediaItem } from "@hr/shared";
import { PostEditor } from "@/components/portal/content";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova notícia" };

export default async function NewPostPage() {
  await requireContentEditor();
  const media = await apiData<MediaItem[]>("/content/media");
  return (
    <>
      <PageTitle eyebrow="HR NEWS" title="Nova notícia" />
      <PostEditor media={media} />
    </>
  );
}
