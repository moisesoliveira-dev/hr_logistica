import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSiteSection, sectionDef, type MediaItem, type SiteItem } from "@hr/shared";
import { SectionManager } from "@/components/portal/site-content";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: isSiteSection(section) ? sectionDef(section).label : "Partes do site" };
}

export default async function SectionPage({ params }: Props) {
  await requireContentEditor();
  const { section } = await params;
  if (!isSiteSection(section)) notFound();
  const [items, media] = await Promise.all([apiData<SiteItem[]>(`/content/site/${section}`), apiData<MediaItem[]>("/content/media")]);
  const def = sectionDef(section);
  return (
    <>
      <PageTitle eyebrow={def.where} title={def.label} />
      <p className="mb-5 flex flex-wrap gap-5 text-sm font-bold">
        <Link href="/portal/conteudo/site" className="inline-flex items-center gap-1 hover:text-brand"><ArrowLeft className="size-4" aria-hidden /> Todas as partes</Link>
        <a href={def.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-deep hover:text-night"><ExternalLink className="size-4" aria-hidden /> Ver no site</a>
      </p>
      <SectionManager key={section} section={section} items={items} media={media} />
    </>
  );
}
