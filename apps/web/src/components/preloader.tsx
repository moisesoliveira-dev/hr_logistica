"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";

const DURATION = 1.5;

function Truck() {
  return (
    <svg viewBox="0 0 168 76" className="w-14">
      <rect x="2" y="4" width="108" height="50" rx="7" fill="#fff" />
      <rect x="2" y="40" width="108" height="8" fill="#8cc63f" />
      <path d="M115 16h25c3 0 5 1 7 4l13 19c1 2 2 3 2 6v9h-47Z" fill="#0d9633" />
      <path d="M124 22h15c2 0 3 .5 4 2l9 14h-28Z" fill="#dff1d0" />
      {[24, 48, 124, 148].map((x) => <circle key={x} cx={x} cy="62" r="10" fill="#06170c" stroke="#fff" strokeWidth="5" />)}
    </svg>
  );
}

/** Tela de abertura: um caminhão pequeno acompanha o carregamento. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const progress = useMotionValue(0);
  const label = useTransform(progress, (v) => `${Math.round(v)}%`);
  const position = useTransform(progress, (v) => `${v}%`);
  const offset = useTransform(progress, (v) => `-${v}%`);
  const trail = useTransform(progress, (v) => v / 100);

  useEffect(() => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = animate(progress, 100, { duration: instant ? 0.01 : DURATION, ease: [0.45, 0, 0.25, 1], onComplete: onDone });
    return () => controls.stop();
  }, [onDone, progress]);

  return (
    <motion.div
      className="preloader fixed inset-0 z-[100] flex items-center justify-center bg-night px-6 text-white"
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      aria-hidden
    >
      <motion.div className="flex w-64 flex-col items-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ y: -12 }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <div className="rounded-2xl bg-white px-4 py-3">
          <Image src="/brand/logo.jpg" alt="" width={170} height={48} preload />
        </div>

        <div className="mt-10 w-full">
          <motion.div className="w-14" style={{ marginLeft: position, x: offset }}>
            <Truck />
          </motion.div>
          <div className="mt-px h-0.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full origin-left bg-leaf" style={{ scaleX: trail }} />
          </div>
        </div>

        <p className="mt-4 text-xs font-bold tabular-nums tracking-[0.25em] text-white/50">
          <motion.span>{label}</motion.span>
        </p>
      </motion.div>
    </motion.div>
  );
}
