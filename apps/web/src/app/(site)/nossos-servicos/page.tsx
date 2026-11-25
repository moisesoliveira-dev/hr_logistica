import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal, SplitText } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { services, solutions, type Detail } from "@/lib/content";

const intro = "Cobrimos diferentes setores da indústria, desde alimentos e bebidas, produtos químicos, varejo, bens duráveis e muito mais. Verifique a lista completa.";

export const metadata: Metadata = { title: "Nossos Serviços", description: intro };

/* Os cartões com foto ficam só na página inicial. Aqui vai a lista para consulta, com a explicação de cada item. */
const groups: { title: string; path: string; items: Detail[] }[] = [
  { title: "Serviços", path: "servico", items: services },
  { title: "Soluções", path: "solucao", items: solutions },
];

export default function NossosServicos() {
  return (
    <>
      <PageHero title="Cada carga, um caminho" eyebrow="Nossos Serviços" image="/fotos/sede-04.jpg" intro={intro} />
      <div className="wrap max-w-5xl space-y-20 py-24">
        {groups.map((group) => (
          <section key={group.path}>
            <SplitText text={group.title} className="display text-4xl sm:text-6xl" />
            <ul className="mt-8 border-t border-ink/15">
              {group.items.map((item, i) => (
                <li key={item.slug} className="border-b border-ink/15">
                  <Reveal from={i % 2 ? "right" : "left"}>
                    <Link href={`/${group.path}/${item.slug}`} className="group relative flex items-start gap-5 overflow-hidden px-3 py-7 sm:gap-8 sm:px-6">
                      <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-night transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                      <span aria-hidden className="relative font-display text-lg font-extrabold text-brand group-hover:text-leaf">{String(i + 1).padStart(2, "0")}</span>
                      <span className="relative min-w-0 flex-1 transition-colors duration-300 group-hover:text-white group-focus-visible:text-white">
                        <h3 className="text-2xl font-extrabold sm:text-3xl">{item.title}</h3>
                        <span className="mt-2 block leading-relaxed opacity-75">{item.paragraphs[0]}</span>
                      </span>
                      <span aria-hidden className="relative hidden size-12 shrink-0 place-items-center rounded-full border border-ink/20 transition duration-500 group-hover:rotate-45 group-hover:border-leaf group-hover:bg-leaf group-hover:text-night sm:grid">
                        <ArrowUpRight className="size-5" />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
