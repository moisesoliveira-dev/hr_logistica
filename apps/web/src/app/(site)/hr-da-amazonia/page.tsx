import type { Metadata } from "next";
import { Gallery } from "@/components/gallery";
import { ParallaxImage, Reveal, SplitText } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { getSiteContent } from "@/lib/site";

export const metadata: Metadata = { title: "HR Armazéns Gerais" };

const blocks = [
  { title: "Estrutura própria", image: "/fotos/sede-02.jpg", text: "Nossa estrutura própria conta com uma área superior a 42.000 m², entre área construída e de pátio. Nosso Centro de Distribuição tem 700 m² de área administrativa, divididos em salas de reuniões, auditório, escritório, refeitório, vestiário, etc." },
  { title: "Pátio e oficina", image: "/fotos/frota-01.jpg", text: "Para estacionamento de carretas e operações diversas (área toda murada e piso em concreto usinado 35 MPa x 16 cm de espessura) e oficina coberta com serviços automatizados e profissionais especializados nas áreas de mecânica, elétrica, pintura, funilaria, tornearia, solda e outros serviços para a manutenção de toda a frota de caminhões, cavalos mecânicos, carretas abertas e carretas baú." },
  { title: "Armazenamento", image: "/fotos/armazem-03.jpg", text: "O armazenamento conta com uma infraestrutura com 7.000 m² de galpões, com 6 docas para carga e descarga e área de armazenagem com mais de 5.000 posições “pallets” verticalizadas. Toda área é coberta por sistema de segurança eletrônica e vigilância noturna, para o conforto e proteção das cargas que passam por nós." },
];

// o marketing edita partes desta página pelo portal
export const dynamic = "force-dynamic";

export default async function ArmazensGerais() {
  const site = await getSiteContent();
  return (
    <>
      <PageHero title="HR Armazéns Gerais" eyebrow="Institucional" image="/fotos/armazem-01.jpg" />
      <div className="wrap space-y-28 py-24">
        {blocks.map((b, i) => (
          <section key={b.title} className="grid items-center gap-12 lg:grid-cols-2">
            <ParallaxImage src={b.image} alt={b.title} className={`aspect-[4/3] rounded-[2.5rem] ${i % 2 ? "lg:order-2" : ""}`} />
            <div>
              <p className="display text-7xl text-leaf" aria-hidden>0{i + 1}</p>
              <SplitText text={b.title} className="display mt-3 text-4xl sm:text-5xl" />
              <Reveal from={i % 2 ? "left" : "right"} className="mt-6 text-lg leading-relaxed text-ink/75">{b.text}</Reveal>
            </div>
          </section>
        ))}
      </div>
      <Gallery label="Armazéns da HR da Amazônia" images={site.galeria_armazens} />
    </>
  );
}
