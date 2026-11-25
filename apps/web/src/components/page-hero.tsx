"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { EASE, SplitText } from "./motion";
import { useReady } from "./providers";

export function PageHero({ title, eyebrow, image, intro }: { title: string; eyebrow: string; image: string; intro?: string }) {
  const ref = useRef<HTMLElement>(null);
  const ready = useReady();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  return (
    <section ref={ref} className="relative flex min-h-[72svh] items-end overflow-hidden rounded-b-[2.5rem] bg-night text-white sm:rounded-b-[4rem]">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <motion.div className="relative h-full w-full" initial={{ scale: 1.35 }} animate={ready ? { scale: 1 } : undefined} transition={{ duration: 2.2, ease: EASE }}>
          <Image src={image} alt="" fill preload sizes="100vw" unoptimized={image.startsWith("/midia/")} className="object-cover" />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/65 to-night/30" />
      <div className="wrap relative pb-16 pt-40">
        <motion.nav aria-label="Trilha" className="mb-8 flex items-center gap-2 text-sm text-white/70" initial={{ opacity: 0, x: -40 }} animate={ready ? { opacity: 1, x: 0 } : undefined} transition={{ duration: 0.8, delay: 0.2 }}>
          <Link href="/" className="hover:text-leaf">Início</Link>
          <ChevronRight className="size-4" aria-hidden />
          <span className="text-leaf">{eyebrow}</span>
        </motion.nav>
        <SplitText as="h1" text={title} delay={0.25} className="display max-w-5xl text-[clamp(2.6rem,8vw,7rem)]" />
        {intro && (
          <motion.p className="mt-6 max-w-2xl text-lg text-white/85" initial={{ opacity: 0, y: 40 }} animate={ready ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.9, delay: 0.7, ease: EASE }}>{intro}</motion.p>
        )}
        <motion.div aria-hidden className="mt-10 h-1.5 origin-left rounded-full bg-gradient-to-r from-leaf via-brand to-transparent" initial={{ scaleX: 0 }} animate={ready ? { scaleX: 1 } : undefined} transition={{ duration: 1.6, delay: 0.6, ease: EASE }} />
      </div>
    </section>
  );
}
