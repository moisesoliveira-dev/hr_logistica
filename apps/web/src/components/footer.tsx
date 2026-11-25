import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { addressLines, socialNetworks, telHref, type SiteSettings } from "@hr/shared";
import { company, nav } from "@/lib/content";
import { FooterCta } from "./footer-cta";
import { BrandIcon } from "./icons";
import { Marquee, Reveal } from "./motion";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative overflow-hidden bg-night text-white">
      <Marquee speed={1.8} className="border-y border-white/10 bg-brand py-5">
        {["Transporte rodo-fluvial", "Cabotagem", "Armazenagem", "Cargas perigosas", "Entrega programada"].map((t) => (
          <span key={t} className="flex items-center font-display text-3xl font-extrabold uppercase sm:text-5xl">
            <span className="px-8">{t}</span>
            <span className="size-3 rotate-45 bg-leaf" />
          </span>
        ))}
      </Marquee>

      <div className="grid-lines">
        <FooterCta />

        <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <Image src="/brand/logo.jpg" alt={`${company.name} ${company.tagline}`} width={220} height={62} className="rounded-2xl bg-white p-2" />
            {settings.social.length > 0 && <h2 className="mt-8 text-lg font-bold">Siga HRLOG nas Redes Sociais</h2>}
            <div className="mt-4 flex flex-wrap gap-3">
              {settings.social.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={socialNetworks[s.network]} className="grid size-12 place-items-center rounded-full border border-white/20 transition hover:rotate-[360deg] hover:border-leaf hover:bg-leaf hover:text-night hover:duration-700">
                  <BrandIcon id={s.network} />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="eyebrow mb-5 !font-sans text-leaf">Navegue</h2>
            <ul className="grid gap-2 text-sm text-white/75">
              {nav.flatMap((i) => ("children" in i ? i.children : [i])).filter((l) => !l.href.startsWith("/servico/")).map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-leaf">{l.label}<ArrowUpRight className="size-3.5" aria-hidden /></a>
                  ) : (
                    <Link href={l.href} className="inline-block transition hover:translate-x-1.5 hover:text-leaf">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.16}>
            <h2 className="eyebrow mb-5 !font-sans text-leaf">Telefone</h2>
            <ul className="space-y-4">
              {settings.phones.map((p, i) => (
                <li key={i}>
                  <a href={telHref(p.number)} className="group flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-white/10 transition group-hover:bg-brand"><Phone className="size-4" aria-hidden /></span>
                    <span><span className="block text-xs uppercase tracking-widest text-white/50">{p.label}</span><span className="font-display text-xl font-bold">{p.number}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.24}>
            <h2 className="eyebrow mb-5 !font-sans text-leaf">Endereço</h2>
            <address className="flex gap-3 not-italic text-white/75">
              <MapPin className="mt-1 size-5 shrink-0 text-leaf" aria-hidden />
              <span>{addressLines(settings.address).map((l, i) => <span key={i} className="block">{l}</span>)}</span>
            </address>
            <a href={`mailto:${settings.email}`} className="mt-5 inline-block break-all text-sm underline decoration-leaf underline-offset-4 hover:text-leaf">{settings.email}</a>
          </Reveal>
        </div>

        <p className="wrap border-t border-white/10 py-7 pr-24 text-sm text-white/50">
          © {new Date().getFullYear()} - {company.name} | Todos os direitos reservados. ·{" "}
          <Link href="/login" prefetch={false} className="font-bold hover:text-leaf">Área do Colaborador</Link>
        </p>
      </div>
    </footer>
  );
}
