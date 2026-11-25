import { Hero } from "@/components/hero";
import { Marquee, ParallaxImage, Reveal, SplitText } from "@/components/motion";
import { NetworkMap } from "@/components/network-map";
import { Clients, Principles, Quote, ScrollText, Solutions, Stats } from "@/components/sections";
import { ServicesRail } from "@/components/services-rail";
import { Testimonials } from "@/components/testimonials";
import { Button } from "@/components/ui";
import { about } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { getSiteContent } from "@/lib/site";

const cities = ["Manaus", "Belém", "Boa Vista", "Codó", "Goiânia", "Guarulhos", "Porto Velho", "Fortaleza"];

// o marketing edita partes desta página pelo portal
export const dynamic = "force-dynamic";

export default async function Home() {
  const [site, settings] = await Promise.all([getSiteContent(), getSettings()]);
  return (
    <>
      <Hero slides={site.destaques} welcome={settings.welcome} />
      <Marquee speed={1.4} className="py-8">
        {cities.map((c) => (
          <span key={c} className="flex items-center font-display text-5xl font-extrabold uppercase text-brand sm:text-7xl">
            <span className="px-8">{c}</span>
            <span aria-hidden className="text-leaf">→</span>
          </span>
        ))}
      </Marquee>
      <Solutions />

      <section className="wrap grid items-center gap-14 py-16 lg:grid-cols-2">
        <div className="relative pb-16 pr-10">
          <ParallaxImage src="/fotos/sede-05.jpg" alt="Complexo logístico da HR da Amazônia cercado pela floresta" className="aspect-[4/5] rounded-[2.5rem]" />
          <Reveal from="right" delay={0.3} className="absolute bottom-0 right-0 w-3/5">
            <ParallaxImage src="/fotos/frota-04.jpg" alt="Caminhão com a marca HR da Amazônia" className="aspect-video rounded-3xl border-8 border-paper" />
          </Reveal>
        </div>
        <div>
          <p className="eyebrow text-brand-deep">Desde 1997</p>
          <SplitText text="Logística com raízes na floresta" className="display mt-4 text-4xl sm:text-6xl" />
          <ScrollText text={about.text[0]} className="mt-8 text-xl font-medium leading-relaxed" />
          <div className="mt-10"><Button href="/quem-somos">Conheça a empresa</Button></div>
        </div>
      </section>

      <Stats />
      <ServicesRail />
      <Principles />

      <section className="grid-lines overflow-hidden bg-night py-24 text-white">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[2fr_3fr]">
          <div>
            <p className="eyebrow text-leaf">Nossa rede</p>
            <SplitText text="Estamos aqui!" className="display mt-4 text-5xl sm:text-7xl" />
            <Reveal delay={0.2}>
              <p className="mt-6 text-lg text-white/75">{about.text[3]}</p>
              <div className="mt-9"><Button href="/onde-estamos" variant="leaf">Ver endereços</Button></div>
            </Reveal>
          </div>
          <NetworkMap />
        </div>
      </section>

      {site.depoimentos.length > 0 && (
        <section id="depoimentos" className="overflow-hidden py-28">
          <div className="wrap max-w-4xl">
            <p className="eyebrow text-brand-deep">Depoimentos</p>
            <SplitText text="Referência em Negócios" className="display mb-12 mt-4 text-4xl sm:text-6xl" />
            <Testimonials items={site.depoimentos} />
          </div>
        </section>
      )}
      <Quote />
      <Clients items={site.clientes} />
    </>
  );
}
