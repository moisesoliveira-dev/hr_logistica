"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight, Eye, HeartHandshake, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { about, quote, solutions, stats } from "@/lib/content";
import type { SitePhoto } from "@/lib/site-types";
import { Counter, EASE, Marquee, Reveal, SplitText, Tilt } from "./motion";

export function Solutions() {
  return (
    <section id="solucoes" className="wrap scroll-mt-24 py-24 sm:py-32">
      <p className="eyebrow text-brand-deep">Como ajudamos</p>
      <SplitText text="Soluções em Logística" highlight={["Logística"]} className="display mt-4 max-w-3xl text-5xl sm:text-7xl [&_.text-leaf]:text-brand" />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {solutions.map((s, i) => (
          <motion.div
            key={s.slug}
            className={i === 1 ? "lg:mt-16" : ""}
            initial={{ opacity: 0, y: 160, rotateX: 38, rotate: (i - 1) * 7 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 75, damping: 15, delay: i * 0.14 }}
            style={{ transformPerspective: 1100 }}
          >
            <Tilt className="h-full rounded-[2rem]">
              <Link href={`/solucao/${s.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-night/5">
                <span className="relative block h-64 overflow-hidden">
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:-rotate-2 group-hover:scale-115" />
                </span>
                <span className="relative flex flex-1 flex-col p-7">
                  <span className="absolute -top-8 right-6 grid size-16 place-items-center rounded-full border-4 border-white bg-brand text-white transition duration-500 group-hover:rotate-[405deg] group-hover:bg-night">
                    <ArrowUpRight className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-2xl font-extrabold">{s.title}</h3>
                  <span className="mt-3 block text-ink/70">{s.short}</span>
                  <span className="mt-6 block h-1 w-12 rounded-full bg-leaf transition-all duration-500 group-hover:w-full" />
                </span>
              </Link>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section aria-label="Números da empresa" className="wrap py-16">
      <dl className="grid gap-px overflow-hidden rounded-[2.5rem] bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} from="zoom" delay={i * 0.12} className="group relative flex flex-col-reverse justify-end overflow-hidden bg-brand-deep p-8 text-white">
            <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 bg-night transition-transform duration-500 group-hover:scale-y-100" />
            <dt className="relative mt-2 text-sm font-semibold text-white/75">{s.label}</dt>
            <dd className="relative font-display text-5xl font-extrabold tracking-tight xl:text-6xl"><Counter {...s} /></dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [10, 0]);
  return <motion.span className="mr-[0.25em] inline-block" style={{ opacity, y }}>{children}</motion.span>;
}

/** Parágrafo que "acende" palavra por palavra conforme a rolagem. */
export function ScrollText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>
        ))}
      </span>
    </p>
  );
}

/** Missão, Visão e Valores em cartões que se empilham durante a rolagem. */
export function Principles() {
  const cards = [
    { title: "Missão", icon: Target, text: about.mission, cls: "bg-brand text-white" },
    { title: "Visão", icon: Eye, text: about.vision, cls: "bg-night text-white" },
    { title: "Valores", icon: HeartHandshake, values: about.values, cls: "bg-leaf text-night" },
  ];
  return (
    <section className="wrap py-24">
      <p className="eyebrow text-brand-deep">Quem nos move</p>
      <SplitText text="HR DA AMAZÔNIA" className="display mt-4 text-5xl sm:text-7xl" />
      <div className="mt-14">
        {cards.map((c, i) => (
          <div key={c.title} className="sticky mb-10" style={{ top: `${7 + i * 2}rem` }}>
            <motion.article
              className={`grid min-h-[19rem] gap-8 overflow-hidden rounded-[2.5rem] p-8 shadow-2xl shadow-night/20 sm:p-14 md:grid-cols-[1fr_2fr] ${c.cls}`}
              initial={{ scale: 0.82, rotate: i % 2 ? 5 : -5, y: 80 }}
              whileInView={{ scale: 1, rotate: 0, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div>
                <motion.span className="inline-block" whileInView={{ rotate: [0, -18, 14, -6, 0], scale: [0.4, 1.2, 1] }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.2 }}>
                  <c.icon className="size-14" strokeWidth={1.5} aria-hidden />
                </motion.span>
                <h3 className="mt-5 text-4xl font-extrabold">{c.title}</h3>
              </div>
              {c.text ? (
                <p className="self-center font-display text-2xl font-semibold leading-snug sm:text-3xl">{c.text}</p>
              ) : (
                <ul className="flex flex-wrap content-center gap-3">
                  {c.values!.map((v, j) => (
                    <motion.li key={v} className="rounded-full bg-night px-6 py-3 font-display text-lg font-bold text-white" initial={{ opacity: 0, scale: 0, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 240, damping: 13, delay: 0.3 + j * 0.1 }} whileHover={{ rotate: j % 2 ? 6 : -6, scale: 1.1 }}>
                      {v}
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.article>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Quote() {
  return (
    <figure className="wrap py-24 text-center">
      <motion.div aria-hidden className="font-display text-9xl font-extrabold leading-[0.6] text-brand" initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 130, damping: 11 }}>“</motion.div>
      <blockquote className="mx-auto max-w-5xl">
        <ScrollText text={quote.text} className="display text-3xl sm:text-5xl !leading-[1.15]" />
      </blockquote>
      <motion.figcaption className="eyebrow mt-8 text-brand-deep" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>{quote.author}</motion.figcaption>
    </figure>
  );
}

export function Clients({ items }: { items: SitePhoto[] }) {
  if (!items.length) return null;
  // com poucos logos, repete até a faixa ficar cheia
  const clients = Array.from({ length: Math.ceil(8 / items.length) }, (_, copy) => items.map((c) => ({ ...c, key: `${copy}-${c.id}` }))).flat();
  const row = (list: typeof clients) =>
    list.map((c) => (
      <div key={c.key} className="mx-3 grid h-32 w-56 place-items-center rounded-3xl bg-white p-4 shadow-lg shadow-night/5 transition duration-300 hover:-translate-y-2 hover:shadow-brand/30">
        <Image src={c.src} alt={c.title} width={160} height={100} unoptimized={c.src.startsWith("/midia/")} className="max-h-24 w-auto object-contain grayscale transition duration-500 hover:scale-110 hover:grayscale-0" />
      </div>
    ));
  return (
    <section className="overflow-hidden py-24">
      <div className="wrap">
        <SplitText text="Eles estão felizes com a gente" highlight={["felizes"]} className="display text-center text-4xl sm:text-6xl [&_.text-leaf]:text-brand" />
      </div>
      <div className="mt-12 -rotate-2 space-y-2">
        <Marquee speed={1.6} skew={false} className="py-3">{row(clients)}</Marquee>
        <Marquee speed={-1.2} skew={false} className="py-3">{row([...clients].reverse())}</Marquee>
      </div>
    </section>
  );
}
