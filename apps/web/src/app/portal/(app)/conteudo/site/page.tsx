import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { sectionDef, type SiteSection } from "@hr/shared";
import { Card, PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Partes do site" };

export default async function SitePartsPage() {
  await requireContentEditor();
  const summary = await apiData<{ section: SiteSection; total: number; visible: number }[]>("/content/site");
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Partes do site" />
      <div className="grid gap-4 sm:grid-cols-2">
        {summary.map((s, i) => {
          const def = sectionDef(s.section);
          return (
            <Card key={s.section} delay={i * 0.07}>
              <Link href={`/portal/conteudo/site/${s.section}`} className="group block">
                <h2 className="display text-2xl group-hover:text-brand">{def.label}</h2>
                <p className="mt-2 text-sm text-ink/60">{def.where}</p>
                <p className="mt-5 flex items-center justify-between font-extrabold">
                  <span>{s.visible} no ar{s.total > s.visible ? ` · ${s.total - s.visible} oculto(s)` : ""}</span>
                  <ArrowRight className="size-5 transition group-hover:translate-x-2" aria-hidden />
                </p>
              </Link>
            </Card>
          );
        })}
      </div>
    </>
  );
}
