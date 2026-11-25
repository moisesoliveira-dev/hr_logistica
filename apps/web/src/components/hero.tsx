"use client";

import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowDown, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SitePhoto } from "@/lib/site-types";
import { EASE, SplitText } from "./motion";
import { useReady } from "./providers";
import { useReduced } from "./use-reduced";
import { Button } from "./ui";

const DURATION = 6;

export function Hero({ slides, welcome }: { slides: SitePhoto[]; welcome: string }) {
  const ready = useReady();
  const reduce = useReduced();
  const [position, setIndex] = useState(0);
  const index = position % slides.length;
  const current = slides[index];
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.93]);
  const visible = useInView(ref, { amount: 0.15 });
  const playing = ready && visible && !paused && !reduce;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), DURATION * 1000);
    return () => clearTimeout(t);
  }, [index, playing, slides.length]);

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 50 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, delay, ease: EASE },
  });

  return (
    <section ref={ref} className="relative bg-paper">
      <motion.div className="relative flex min-h-[max(100svh,44rem)] flex-col justify-end overflow-hidden rounded-b-[2.5rem] bg-night text-white sm:rounded-b-[3.5rem]" style={{ scale: reduce ? 1 : scale }}>
        <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : imageY }}>
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ clipPath: "circle(0% at 78% 62%)", zIndex: 2 }}
              animate={{ clipPath: "circle(150% at 78% 62%)", zIndex: 2 }}
              exit={{ zIndex: 1, clipPath: "circle(150% at 78% 62%)", opacity: 0.99 }}
              transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
            >
              <motion.div className="relative h-full w-full" initial={{ scale: 1.3 }} animate={{ scale: 1.04 }} transition={{ duration: DURATION + 2, ease: "easeOut" }}>
                <Image src={current.src} alt={current.alt || current.subtitle || current.title} fill sizes="100vw" preload={index === 0} unoptimized={current.src.startsWith("/midia/")} className="object-cover" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="absolute inset-0 z-[3] bg-gradient-to-r from-night/90 via-night/55 to-night/10" />
        <div className="absolute inset-0 z-[3] bg-gradient-to-t from-night via-transparent to-night/30" />

        <motion.div className="wrap relative z-10 pb-10 pt-40" style={{ y: reduce ? 0 : textY, opacity: reduce ? 1 : fade }}>
          <motion.p {...enter(0.1)} className="eyebrow text-leaf">{welcome}</motion.p>
          <SplitText as="h1" text="Da Amazônia para todo o Brasil" highlight={["Amazônia"]} delay={0.2} className="display mt-6 max-w-5xl text-[clamp(3.2rem,9.5vw,8.5rem)]" />
          <motion.p {...enter(0.8)} className="mt-6 max-w-xl text-lg text-white/80">
            Soluções logísticas com foco no transporte rodo-fluvial e cabotagem. Desde 1997 movendo cargas com segurança.
          </motion.p>
          <motion.div {...enter(1)} className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="/cotacao-online" variant="leaf" magnetic>Cotação Online</Button>
            <Button href="/rastreamento" variant="outline">Acompanhe sua carga</Button>
          </motion.div>

          <div className="mt-14 flex items-end justify-between gap-4 pr-20 sm:gap-6">
            <div className="grid flex-1 gap-3 sm:max-w-2xl" style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}>
              {slides.map((s, i) => (
                <button key={s.id} type="button" onClick={() => setIndex(i)} aria-label={`Ver foto: ${s.title}`} aria-current={i === index} className="group flex cursor-pointer flex-col items-stretch justify-start py-2 text-left">
                  <span className="block h-1 overflow-hidden rounded-full bg-white/25">
                    <motion.span
                      key={`${i === index}-${playing}`}
                      className="block h-full origin-left bg-leaf"
                      initial={{ scaleX: i === index && playing ? 0 : i === index ? 1 : 0 }}
                      animate={{ scaleX: i === index ? 1 : 0 }}
                      transition={{ duration: i === index && playing ? DURATION : 0.3, ease: "linear" }}
                    />
                  </span>
                  <span className={`mt-2 hidden text-xs font-bold uppercase tracking-widest sm:block ${i === index ? "text-white" : "text-white/50 group-hover:text-white"}`}>{s.title}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Reproduzir apresentação" : "Pausar apresentação"} className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/30 hover:bg-white/10">
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <a href="#solucoes" aria-label="Rolar para as soluções" className="hidden size-14 place-items-center rounded-full bg-white text-night md:grid">
                <motion.span animate={visible ? { y: [-5, 6, -5] } : { y: 0 }} transition={{ duration: 1.4, repeat: visible ? Infinity : 0 }}><ArrowDown className="size-5" /></motion.span>
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
