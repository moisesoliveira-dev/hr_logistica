import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { SmartForm } from "@/components/smart-form";

const intro = "Solicite uma Cotação Online sem compromisso. Veja como é rápido e fácil: apenas preencha o nosso formulário e em breve nossa equipe entrará em contato.";

export const metadata: Metadata = { title: "Cotação Online", description: intro };

const steps = [
  ["Preencha", "Conte origem, destino, dimensões e peso da carga."],
  ["Analisamos", "Nossa equipe avalia a melhor solução logística."],
  ["Retornamos", "Entramos em contato com você, sem compromisso."],
];

export default function CotacaoOnline() {
  return (
    <>
      <PageHero title="Cotação Online" eyebrow="Cotação" image="/fotos/frota-03.jpg" intro={intro} />
      <ol className="wrap grid gap-5 py-16 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title}>
            <Reveal from="zoom" delay={i * 0.18} className="h-full rounded-[2rem] bg-night p-7 text-white">
              <span className="display text-6xl text-leaf" aria-hidden>0{i + 1}</span>
              <h2 className="mt-3 text-2xl font-extrabold">{title}</h2>
              <p className="mt-2 text-white/70">{text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <section className="wrap max-w-4xl pb-24"><SmartForm kind="cotacao" submitLabel="Solicitar cotação" /></section>
    </>
  );
}
