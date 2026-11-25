import type { Metadata } from "next";
import type { MediaItem } from "@hr/shared";
import { ImageLibrary, ImageUploader } from "@/components/portal/content";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Imagens" };

export default async function ImagesPage() {
  await requireContentEditor();
  const media = await apiData<MediaItem[]>("/content/media");
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Imagens" />
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <ImageUploader />
        <ImageLibrary items={media} />
      </div>
    </>
  );
}
