"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { SitePhoto } from "@/lib/site-types";

/** Carrossel arrastável com miniaturas. */
export function Gallery({ images, label }: { images: SitePhoto[]; label: string }) {
  const [[position, dir], setState] = useState([0, 1]);
  if (!images.length) return null;
  const index = position % images.length;
  const current = images[index];
  const go = (d: number) => setState([(index + d + images.length) % images.length, d]);
  return (
    <div className="wrap py-20" role="region" aria-roledescription="carrossel" aria-label={label} onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-night sm:aspect-video">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 100}%`, scale: 1.25, opacity: 1, zIndex: 1 }),
              center: { x: "0%", scale: 1, opacity: 1, zIndex: 1 },
              exit: (d: number) => ({ x: `${d * -35}%`, scale: 0.85, opacity: 0.4, zIndex: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.35}
            onDragEnd={(_, i) => Math.abs(i.offset.x) > 80 && go(i.offset.x < 0 ? 1 : -1)}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Image src={current.src} alt={current.alt || current.title || `${label} — foto ${index + 1} de ${images.length}`} fill sizes="(min-width: 1280px) 1216px, 100vw" draggable={false} unoptimized={current.src.startsWith("/midia/")} className="object-cover" />
            {current.title && <span className="absolute bottom-5 left-5 max-w-[55%] rounded-full bg-night/80 px-5 py-2.5 text-sm font-bold text-white">{current.title}</span>}
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-5 right-5 z-10 flex gap-3">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="grid size-12 cursor-pointer place-items-center rounded-full bg-white text-night"><ArrowLeft className="size-5" /></motion.button>
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} type="button" onClick={() => go(1)} aria-label="Próxima foto" className="grid size-12 cursor-pointer place-items-center rounded-full bg-leaf text-night"><ArrowRight className="size-5" /></motion.button>
        </div>
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto p-2">
        {images.map((photo, i) => (
          <motion.button key={photo.id} type="button" onClick={() => i !== index && setState([i, i > index ? 1 : -1])} aria-label={`Ir para a foto ${i + 1}`} aria-current={i === index}
            animate={{ scale: i === index ? 1.06 : 1, opacity: i === index ? 1 : 0.55 }} whileHover={{ y: -6, opacity: 1 }}
            className={`relative h-20 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl ${i === index ? "ring-4 ring-brand" : ""}`}>
            <Image src={photo.src} alt="" fill sizes="128px" unoptimized={photo.src.startsWith("/midia/")} className="object-cover" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
