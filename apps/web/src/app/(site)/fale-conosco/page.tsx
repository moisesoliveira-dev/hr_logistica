import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { telHref, whatsappHref } from "@hr/shared";
import { BrandIcon } from "@/components/icons";
import { Reveal, SplitText } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { SmartForm } from "@/components/smart-form";
import { getSettings } from "@/lib/settings";

const intro = "Entre em contato com a HR da Amazônia, nossa equipe especialista em logística está pronta para lhe atender e tirar todas as suas dúvidas.";

export const metadata: Metadata = { title: "Fale Conosco", description: intro };

export default async function FaleConosco() {
  const settings = await getSettings();
  const channels = [
    ...settings.whatsapp.map((w) => ({ label: `WhatsApp ${w.label}`, value: w.description || w.number, href: whatsappHref(w), icon: <BrandIcon id="whatsapp" /> })),
    ...settings.phones.map((p) => ({ label: `Telefone ${p.label}`, value: p.number, href: telHref(p.number), icon: <Phone className="size-5" aria-hidden /> })),
    { label: "E-mail", value: settings.email, href: `mailto:${settings.email}`, icon: <Mail className="size-5" aria-hidden /> },
  ];
  return (
    <>
      <PageHero title="Vamos conversar?" eyebrow="Fale Conosco" image="/fotos/armazem-02.jpg" intro={intro} />
      <section className="wrap grid gap-14 py-24 lg:grid-cols-[2fr_3fr]">
        <div>
          <SplitText text="Escolha o seu canal" className="display text-4xl sm:text-5xl" />
          <ul className="mt-8 space-y-3">
            {channels.map((c, i) => (
              <li key={`${i}-${c.label}`}>
                <Reveal from="left" delay={i * 0.08}>
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-lg shadow-night/5 transition duration-300 hover:translate-x-3 hover:bg-night hover:text-white">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white transition duration-500 group-hover:rotate-[360deg]">{c.icon}</span>
                    <span><strong className="block">{c.label}</strong><span className="break-all text-sm opacity-70">{c.value}</span></span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
        <SmartForm kind="contato" submitLabel="Enviar mensagem" />
      </section>
    </>
  );
}
