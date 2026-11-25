"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { SitePhoto } from "@/lib/site-types";

const card = "col-start-1 row-start-1 flex flex-col rounded-[2.5rem] p-8 sm:p-12";

function Content({ t }: { t: SitePhoto }) {
  return (
    <>
      <div className="flex gap-1" role="img" aria-label="Avaliação: 5 de 5 estrelas">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.08, type: "spring" }}>
            <Star className="size-6 fill-leaf text-leaf" aria-hidden />
          </motion.span>
        ))}
      </div>
      <blockquote className="mb-8 mt-6 text-xl font-medium leading-relaxed sm:text-2xl">“{t.text}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-4">
        <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-brand font-display text-xl font-extrabold text-white" aria-hidden>
          {t.src
            ? <Image src={t.src} alt="" fill sizes="56px" unoptimized={t.src.startsWith("/midia/")} className="object-cover" />
            : t.title.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
        </span>
        <span><strong className="block font-display text-lg">{t.title}</strong><span className="text-sm text-ink/60">{t.subtitle}</span></span>
      </figcaption>
    </>
  );
}

export function Testimonials({ items }: { items: SitePhoto[] }) {
  const [[position, dir], setState] = useState([0, 1]);
  const index = position % items.length;
  const go = (d: number) => setState([(index + d + items.length) % items.length, d]);

  return (
    <div>
      <div className="grid [perspective:1400px]">
        {/* moldes invisíveis: todos na mesma célula, então a altura é sempre a do maior comentário */}
        {items.map((t) => (
          <div key={t.id} className={`${card} invisible`} aria-hidden>
            <Content t={t} />
          </div>
        ))}
        <AnimatePresence initial={false} custom={dir}>
          <motion.figure
            key={index}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 75}%`, rotateY: d * 35, rotate: d * 7, opacity: 0, scale: 0.8 }),
              center: { x: "0%", rotateY: 0, rotate: 0, opacity: 1, scale: 1 },
              exit: (d: number) => ({ x: `${d * -75}%`, rotateY: d * -35, rotate: d * -7, opacity: 0, scale: 0.8 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5}
            onDragEnd={(_, info) => Math.abs(info.offset.x) > 90 && go(info.offset.x < 0 ? 1 : -1)}
            className={`${card} cursor-grab bg-white shadow-2xl shadow-night/10 active:cursor-grabbing`}
          >
            <Content t={items[index]} />
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <motion.button whileHover={{ scale: 1.12, x: -4 }} whileTap={{ scale: 0.88 }} type="button" onClick={() => go(-1)} aria-label="Depoimento anterior" className="grid size-14 cursor-pointer place-items-center rounded-full border border-ink/20 bg-white"><ArrowLeft className="size-5" /></motion.button>
        <span className="font-display font-bold tabular-nums">{index + 1} / {items.length}</span>
        <motion.button whileHover={{ scale: 1.12, x: 4 }} whileTap={{ scale: 0.88 }} type="button" onClick={() => go(1)} aria-label="Próximo depoimento" className="grid size-14 cursor-pointer place-items-center rounded-full bg-night text-white"><ArrowRight className="size-5" /></motion.button>
      </div>
    </div>
  );
}
