import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { Detail } from "@/lib/content";
import { ParallaxImage, Reveal, SplitText } from "./motion";
import { PageHero } from "./page-hero";
import { Button } from "./ui";

export function DetailPage({ item, siblings, base, eyebrow }: { item: Detail; siblings: Detail[]; base: string; eyebrow: string }) {
  const next = siblings[(siblings.findIndex((s) => s.slug === item.slug) + 1) % siblings.length];
  return (
    <>
      <PageHero title={item.title} eyebrow={eyebrow} image={item.image} />
      <section className="wrap grid gap-14 py-24 lg:grid-cols-[3fr_2fr]">
        <div>
          {item.paragraphs.map((p, i) => (
            <Reveal key={p} delay={i * 0.08}>
              <p className={i === 0 ? "font-display text-2xl font-semibold leading-snug sm:text-3xl" : "mt-6 text-lg leading-relaxed text-ink/75"}>{p}</p>
            </Reveal>
          ))}
          {item.bullets && (
            <div className="mt-14">
              <SplitText text={item.bullets.title} className="display text-3xl sm:text-4xl" />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {item.bullets.items.map((b, i) => (
                  <li key={b}>
                    <Reveal from={i % 2 ? "right" : "left"} delay={(i % 2) * 0.1} className="h-full">
                      <div className="group flex h-full items-start gap-3 rounded-2xl bg-white p-5 shadow-lg shadow-night/5 transition duration-300 hover:-translate-y-1 hover:bg-night hover:text-white">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-leaf text-night transition duration-500 group-hover:rotate-[360deg]"><Check className="size-4" strokeWidth={3} aria-hidden /></span>
                        <span className="font-semibold">{b}</span>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-12"><Button href="/cotacao-online">Solicitar cotação</Button></div>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <ParallaxImage src={item.image} alt={item.title} className="aspect-[4/3] rounded-[2rem]" />
          <Reveal from="right" className="rounded-[2rem] bg-night p-6 text-white">
            <h2 className="eyebrow !font-sans text-leaf">{eyebrow}</h2>
            <ul className="mt-4">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link href={`${base}/${s.slug}`} aria-current={s.slug === item.slug ? "page" : undefined} className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${s.slug === item.slug ? "bg-brand" : "hover:bg-white/10"}`}>
                    {s.title}<ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-1.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </aside>
      </section>
      <Link href={`${base}/${next.slug}`} className="group relative block overflow-hidden py-16">
        <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-y-100" />
        <span className="wrap relative flex items-center justify-between gap-6 group-hover:text-white">
          <span><span className="eyebrow">Próximo</span><span className="display mt-3 block text-3xl sm:text-6xl">{next.title}</span></span>
          <ArrowRight className="size-12 shrink-0 transition duration-500 group-hover:translate-x-4 group-hover:scale-125" aria-hidden />
        </span>
      </Link>
    </>
  );
}
