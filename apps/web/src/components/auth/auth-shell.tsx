"use client";

import { motion, MotionConfig } from "motion/react";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useReduced } from "../use-reduced";

const EASE = [0.16, 1, 0.3, 1] as const;
const photos = ["/fotos/sede-03.jpg", "/fotos/sede-02.jpg", "/fotos/frota-03.jpg", "/fotos/armazem-03.jpg"];
const ROUTE = "M20 150 C 110 40, 190 190, 280 100 S 430 30, 500 80";

/** Tela dividida do acesso: de um lado a operação em movimento, do outro o formulário. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const reduce = useReduced();
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setPhoto((p) => (p + 1) % photos.length), 6000);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <MotionConfig reducedMotion="user">
      <main id="conteudo" className="portal grid min-h-svh overflow-x-clip lg:grid-cols-[1.15fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-night text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          {photos.map((src, i) => (
            <motion.div key={src} className="absolute inset-0" initial={false}
              animate={{ opacity: i === photo ? 1 : 0, scale: i === photo ? 1.04 : 1.25 }}
              transition={{ opacity: { duration: 1.4 }, scale: { duration: 7, ease: "easeOut" } }}>
              <Image src={src} alt="" fill preload={i === 0} sizes="55vw" className="object-cover" />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/35" />
          <motion.p className="eyebrow relative text-leaf" initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: EASE }}>
            Portal do Colaborador
          </motion.p>
          <div className="relative">
            <h2 className="display text-6xl xl:text-7xl">
              {["Quem move", "a carga", "move a HR."].map((line, i) => (
                <span key={line} className="-my-[0.1em] block overflow-hidden py-[0.1em]">
                  <motion.span className={`block origin-bottom-left ${i === 2 ? "text-leaf" : ""}`} initial={{ y: "130%", rotate: 7 }} animate={{ y: "0%", rotate: 0 }} transition={{ duration: 1.1, delay: 0.2 + i * 0.14, ease: EASE }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>
            <svg viewBox="0 0 520 190" className="mt-8 w-full max-w-xl" fill="none" aria-hidden>
              <motion.path d={ROUTE} stroke="var(--color-leaf)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: 0.7, ease: "easeInOut" }} />
              {[[20, 150], [280, 100], [500, 80]].map(([x, y], i) => (
                <motion.circle key={x} cx={x} cy={y} r="9" fill="var(--color-brand)" stroke="#fff" strokeWidth="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.7 + i * 1 }} />
              ))}
              {!reduce && (
                <g>
                  <circle r="17" fill="#fff" />
                  <Truck x={-11} y={-11} width={22} height={22} color="var(--color-night)" />
                  <animateMotion dur="7s" repeatCount="indefinite" path={ROUTE} />
                </g>
              )}
            </svg>
            <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="size-5 text-leaf" aria-hidden /> Acesso exclusivo para funcionários da HR da Amazônia.
            </p>
          </div>
        </aside>

        <section className="grid-lines relative flex flex-col justify-center px-5 py-20 sm:px-12">
          <Link href="/" className="group absolute left-5 top-5 inline-flex items-center gap-2 text-sm font-bold text-ink/70 hover:text-brand sm:left-8 sm:top-8">
            <ArrowLeft className="size-4 transition group-hover:-translate-x-1.5" aria-hidden /> Voltar ao site
          </Link>
          <motion.div className="mx-auto w-full max-w-md" initial="hidden" animate="show" transition={{ staggerChildren: 0.09, delayChildren: 0.15 }}>
            {[
              <Image key="logo" src="/brand/logo.jpg" alt="HR da Amazônia — Soluções Logísticas" width={220} height={62} preload className="mix-blend-multiply" />,
              <h1 key="title" className="display mt-8 text-4xl sm:text-5xl">{title}</h1>,
              <p key="subtitle" className="mt-3 text-ink/65">{subtitle}</p>,
              <div key="form" className="mt-8">{children}</div>,
            ].map((node) => (
              <motion.div key={node.key} variants={{ hidden: { opacity: 0, y: 40, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 130, damping: 16 } } }}>
                {node}
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  );
}
