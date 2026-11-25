import type { Metadata } from "next";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { supportCities, telHref } from "@hr/shared";
import { Reveal, Tilt } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Onde Estamos", description: "Unidades da HR da Amazônia em Manaus, Belém, Codó, Goiânia, Guarulhos e pontos de apoio." };

export default async function OndeEstamos() {
  const { branches } = await getSettings();
  return (
    <>
      <PageHero title="Estamos aqui!" eyebrow="Onde Estamos" image="/fotos/sede-01.jpg" />
      <section className="wrap grid gap-6 py-20 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((b, i) => (
          <Reveal key={`${i}-${b.city}`} from={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"} delay={(i % 3) * 0.12}>
            <Tilt className="h-full rounded-[2rem]">
              <article className="flex h-full flex-col rounded-[2rem] bg-white p-7 shadow-xl shadow-night/5">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white"><MapPin className="size-7" aria-hidden /></span>
                <h2 className="mt-5 text-2xl font-extrabold uppercase">{b.city}</h2>
                {b.support && (
                  <ul className="mt-3 flex flex-wrap gap-2">{supportCities(b.support).map((s) => <li key={s} className="rounded-full bg-leaf/25 px-3 py-1 text-sm font-bold">{s}</li>)}</ul>
                )}
                {b.address && <address className="mt-3 not-italic text-ink/70">{b.address}{b.cep && <><br />CEP: {b.cep}</>}</address>}
                <ul className="mt-5 flex-1 space-y-3 border-t border-ink/10 pt-5 text-sm font-semibold">
                  <li><a className="relative z-30 flex items-center gap-3 break-all hover:text-brand" href={`mailto:${b.email}`}><Mail className="size-4 shrink-0 text-brand" aria-hidden />{b.email}</a></li>
                  <li><a className="relative z-30 flex items-center gap-3 hover:text-brand" href={telHref(b.phone)}><Phone className="size-4 text-brand" aria-hidden />{b.phone}</a></li>
                  {b.corporate && <li><a className="relative z-30 flex items-center gap-3 hover:text-brand" href={telHref(b.corporate)}><Phone className="size-4 text-brand" aria-hidden />Corporativo: {b.corporate}</a></li>}
                </ul>
                {b.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.address, b.cep, b.city].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer" className="relative z-30 mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-night px-5 py-3 text-sm font-bold text-white transition hover:bg-brand">
                    <Navigation className="size-4" aria-hidden /> Abrir no mapa
                  </a>
                )}
              </article>
            </Tilt>
          </Reveal>
        ))}
      </section>
    </>
  );
}
