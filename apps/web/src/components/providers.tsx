"use client";

import Lenis from "lenis";
import { AnimatePresence, motion, MotionConfig, useScroll, useSpring } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Preloader } from "./preloader";

// fora do site público não há tela de abertura, então o padrão é "pronto"
const ReadyContext = createContext(true);
/** true depois que a tela de abertura sai — as animações de entrada esperam por isso. */
export const useReady = () => useContext(ReadyContext);

export function Providers({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const done = useCallback(() => setLoading(false), []);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.14, anchors: true, stopInertiaOnNavigate: true });
    return () => lenis.destroy();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ReadyContext.Provider value={!loading}>
        <AnimatePresence>{loading && <Preloader onDone={done} />}</AnimatePresence>
        <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-brand via-leaf to-brand" style={{ scaleX: progress }} />
        {children}
      </ReadyContext.Provider>
    </MotionConfig>
  );
}
