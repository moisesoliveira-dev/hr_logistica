"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useReady } from "@/components/providers";

/** Transição entre páginas: duas cortinas verdes que se abrem. */
export default function Template({ children }: { children: React.ReactNode }) {
  const ready = useReady();
  // no primeiro carregamento quem faz a abertura é o preloader
  const [navigated] = useState(ready);
  return (
    <>
      {navigated &&
        ["bg-leaf", "bg-brand-deep"].map((color, i) => (
          <motion.div
            key={color}
            aria-hidden
            className={`pointer-events-none fixed inset-0 ${color}`}
            style={{ zIndex: 61 - i }}
            initial={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
            animate={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }}
            transition={{ duration: 0.75, delay: (1 - i) * 0.12, ease: [0.76, 0, 0.24, 1] }}
          />
        ))}
      {children}
    </>
  );
}
