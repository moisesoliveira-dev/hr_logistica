import type { Metadata } from "next";
import { Gallery } from "@/components/gallery";
import { Counter, Marquee, Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { ScrollText } from "@/components/sections";
import { getSiteContent } from "@/lib/site";

export const metadata: Metadata = { title: "Nossa Frota" };

// o marketing edita partes desta página pelo portal
export const dynamic = "force-dynamic";

export default async function NossaFrota() {
  const site = await getSiteContent();
  return (
    <>
      <PageHero title="Nossa Frota" eyebrow="Institucional" image="/fotos/frota-02.jpg" />
      <section className="wrap py-24 text-center">
        <Reveal from="zoom">
          <p className="display text-[clamp(6rem,22vw,17rem)] text-brand"><Counter value={300} prefix="+" /></p>
          <p className="eyebrow">veículos</p>
        </Reveal>
        <ScrollText text="Para melhor atendimento estamos ampliando nossa frota que conta hoje com mais de 300 veículos, entre cavalos mecânicos, carretas baú, abertas, sider, troller e veículos de apoio operacional." className="mx-auto mt-12 max-w-4xl font-display text-2xl font-semibold leading-snug sm:text-4xl" />
      </section>
      <Marquee className="bg-night py-6 text-white">
        {["Cavalos mecânicos", "Carretas baú", "Abertas", "Sider", "Troller", "Apoio operacional"].map((t) => (
          <span key={t} className="flex items-center gap-10 px-5 font-display text-3xl font-extrabold uppercase sm:text-5xl">{t}<span aria-hidden className="text-leaf">✦</span></span>
        ))}
      </Marquee>
      <Gallery label="Frota da HR da Amazônia" images={site.galeria_frota} />
    </>
  );
}
