"use client";

import { motion, useMotionValue, useMotionValueEvent, useInView, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/content";
import { SplitText, Tilt } from "./motion";

/** No desktop a rolagem vertical vira um percurso horizontal; no celular vira lista. */
export function ServicesRail() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [horizontal, setHorizontal] = useState(false);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const progress = scrollYProgress;
  const visible = useInView(section);
  const distanceValue = useMotionValue(0);
  const x = useTransform(() => -progress.get() * distanceValue.get());
  useEffect(() => distanceValue.set(distance), [distance, distanceValue]);
  const truckX = useTransform(progress, [0, 1], ["0%", "100%"]);
  const [step, setStep] = useState(1);
  useMotionValueEvent(progress, "change", (v) => setStep(Math.min(services.length, Math.floor(v * services.length) + 1)));

  // 1º decide o layout pela tela; 2º, já em linha, mede o quanto precisa deslizar
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)");
    const update = () => setHorizontal(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!horizontal || !el) return setDistance(0);
    const measure = () => setDistance(Math.max(0, el.scrollWidth - document.documentElement.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [horizontal]);

  /** Mantém visível o cartão que recebe foco pelo teclado. */
  function reveal(i: number) {
    if (!horizontal || !section.current) return;
    const top = section.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (distance * i) / (services.length - 1) });
  }

  return (
    <section ref={section} className="relative bg-night text-white" style={horizontal ? { height: `calc(100vh + ${distance}px)` } : undefined}>
      <div className={`grid-lines flex flex-col justify-center gap-8 py-20 ${horizontal ? "sticky top-0 h-screen overflow-hidden !py-6" : ""}`}>
        <div className="wrap flex items-end justify-between gap-6 pt-12">
          <div>
            <p className="eyebrow text-leaf">O que fazemos</p>
            <SplitText text="Nossos Serviços" className="display mt-3 text-5xl xl:text-7xl" />
          </div>
          {horizontal && <p className="font-display text-6xl font-extrabold tabular-nums text-white/20">0{step}<span className="text-2xl">/0{services.length}</span></p>}
        </div>

        <motion.div ref={track} className={horizontal ? "flex w-max gap-7 px-[max(2rem,calc((100vw-80rem)/2+2rem))]" : "wrap grid gap-5 sm:grid-cols-2"} style={{ x: horizontal ? x : 0 }}>
          {services.map((s, i) => (
            <motion.div
              key={s.slug}
              className={horizontal ? "w-[min(30rem,38vw)]" : ""}
              initial={{ opacity: 0, y: 90, rotate: i % 2 ? 4 : -4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: "spring", stiffness: 90, damping: 16, delay: (i % 3) * 0.08 }}
              onFocus={() => reveal(i)}
            >
              <Tilt className="h-full rounded-[2rem]">
                <Link href={`/servico/${s.slug}`} className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-[2rem] p-7 ${horizontal ? "!h-[min(30rem,52vh)]" : "min-h-80"}`}>
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:rotate-2 group-hover:scale-115" />
                  <span className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent" />
                  <span className="absolute inset-0 translate-y-full bg-brand-deep/75 transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0" />
                  <span className="absolute left-7 top-6 font-display text-sm font-bold text-leaf">0{i + 1}</span>
                  <span className="absolute right-6 top-6 grid size-12 place-items-center rounded-full bg-white text-night transition duration-500 group-hover:rotate-45 group-hover:bg-leaf">
                    <ArrowUpRight className="size-5" aria-hidden />
                  </span>
                  <h3 className="relative text-2xl font-extrabold xl:text-3xl">{s.title}</h3>
                  <p className="relative mt-2 text-sm text-white/80">{s.short}</p>
                </Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>

        {horizontal && (
          <div className="wrap" aria-hidden>
            <div className="relative h-9 pr-10">
              <svg className="absolute bottom-0 left-0 h-1 w-full text-white/30"><line x1="0" y1="2" x2="100%" y2="2" stroke="currentColor" strokeWidth="3" strokeDasharray="24 24" className={visible ? "road-dash" : ""} /></svg>
              <div className="relative mr-1">
                <motion.div className="w-full text-leaf" style={{ x: truckX }}>
                  <motion.span className="block w-8" animate={visible ? { y: [0, -2, 0] } : { y: 0 }} transition={{ duration: 0.35, repeat: visible ? Infinity : 0 }}>
                    <Truck className="size-8" />
                  </motion.span>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
