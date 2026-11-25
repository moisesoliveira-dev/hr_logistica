import type { Metadata } from "next";
import { Gallery } from "@/components/gallery";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { about } from "@/lib/content";
import { getSiteContent } from "@/lib/site";

export const metadata: Metadata = { title: "Quem Somos", description: about.text[2] };

// o marketing edita partes desta página pelo portal
export const dynamic = "force-dynamic";

export default async function QuemSomos() {
  const site = await getSiteContent();
  return (
    <>
      <PageHero title="HR da Amazônia" eyebrow="Quem Somos" image="/fotos/sede-05.jpg" />
      {/* apresentação, números, missão e a rede de unidades ficam na página inicial; aqui, só o que é desta aba */}
      <section className="wrap grid max-w-5xl gap-10 py-24 md:grid-cols-2">
        {[about.text[1], about.text[2]].map((p, i) => (
          <Reveal key={p} delay={i * 0.15} className="border-t-4 border-brand pt-6 font-display text-2xl font-semibold leading-snug">{p}</Reveal>
        ))}
      </section>
      <Gallery label="Estrutura da HR da Amazônia" images={site.galeria_estrutura} />
    </>
  );
}
