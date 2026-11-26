import type { Metadata } from "next";
import { PostEditor } from "@/components/portal/content";
import { PageTitle } from "@/components/portal/ui";
import { requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova notícia" };

export default async function NewPostPage() {
  await requireContentEditor();
  return (
    <>
      <PageTitle eyebrow="HR NEWS" title="Nova notícia" />
      <PostEditor />
    </>
  );
}
