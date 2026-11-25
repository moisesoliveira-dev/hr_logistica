"use client";

import {
  animate, motion, useAnimationFrame, useInView, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap, type HTMLMotionProps,
} from "motion/react";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useReady } from "./providers";
import { useReduced } from "./use-reduced";

export const EASE = [0.16, 1, 0.3, 1] as const;

/** Título que sobe palavra por palavra, saindo de uma máscara. */
export function SplitText({
  text, as = "h2", className = "", delay = 0, highlight = [],
}: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; delay?: number; highlight?: string[] }) {
  const ready = useReady();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const Tag = as;
  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        className="block"
        initial="hidden"
        animate={ready && inView ? "show" : "hidden"}
        transition={{ staggerChildren: 0.07, delayChildren: delay }}
      >
        {text.split(" ").map((word, i) => (
          <Fragment key={i}>
            <span className="-my-[0.14em] inline-block overflow-hidden py-[0.14em] pr-[0.04em] align-top">
              <motion.span
                className={`inline-block origin-bottom-left ${highlight.includes(word) ? "text-leaf" : ""}`}
                variants={{
                  hidden: { y: "135%", rotate: 9 },
                  show: { y: "0%", rotate: 0, transition: { duration: 1, ease: EASE } },
                }}
              >
                {word}
              </motion.span>
            </span>{" "}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}

const offsets = { up: { y: 80 }, down: { y: -80 }, left: { x: -90 }, right: { x: 90 }, zoom: { scale: 0.8 } };

export function Reveal({
  children, from = "up", delay = 0, ...props
}: HTMLMotionProps<"div"> & { from?: keyof typeof offsets; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Elemento "magnético": é puxado em direção ao cursor. */
export function Magnetic({ children, className = "", strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReduced();
  const x = useSpring(0, { stiffness: 220, damping: 14, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 14, mass: 0.4 });
  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** Cartão com inclinação 3D. */
export function Tilt({ children, className = "", max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReduced();
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  function move(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    ry.set((px / r.width - 0.5) * max);
    rx.set((0.5 - py / r.height) * max);
  }
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onPointerMove={move}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ value, prefix = "", suffix = "", plain = false }: { value: number; prefix?: string; suffix?: string; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReduced();
  const start = plain ? value - 60 : 0;
  const [n, setN] = useState(start);
  useEffect(() => {
    if (!inView) return;
    const c = animate(start, value, { duration: reduce ? 0 : 2.4, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, start, reduce]);
  const format = (v: number) => `${prefix}${plain ? v : v.toLocaleString("pt-BR")}${suffix}`;
  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>{format(n)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** Faixa infinita que acelera e inclina de acordo com a velocidade da rolagem. */
export function Marquee({ children, speed = 2.2, className = "", skew = true }: { children: ReactNode; speed?: number; className?: string; skew?: boolean }) {
  const reduce = useReduced();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-5, 0, 5], { clamp: false });
  const skewX = useTransform(velocity, [-2000, 0, 2000], [7, 0, -7]);
  const x = useTransform(base, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { margin: "100px" });
  useAnimationFrame((_, delta) => {
    if (reduce || !visible) return;
    const b = boost.get();
    if (b < -0.05) direction.current = -1;
    else if (b > 0.05) direction.current = 1;
    base.set(base.get() - direction.current * speed * (Math.min(delta, 64) / 1000) * (1 + Math.min(Math.abs(b), 8)));
  });
  return (
    <div ref={box} className={`overflow-hidden ${className}`}>
      <motion.div className="flex w-max will-change-transform" style={{ x, skewX: skew && !reduce ? skewX : 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex shrink-0 items-center" aria-hidden={i > 0}>{children}</div>
        ))}
      </motion.div>
    </div>
  );
}

/** Imagem que abre como uma cortina e tem parallax. */
export function ParallaxImage({ src, alt, className = "", sizes = "(min-width: 1024px) 50vw, 100vw", priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const ready = useReady();
  const show = ready && inView;
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={show ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <motion.div className="absolute inset-x-0 -inset-y-[11%]" style={{ y }}>
          <motion.div className="relative h-full w-full" initial={{ scale: 1.35 }} animate={show ? { scale: 1 } : undefined} transition={{ duration: 1.8, ease: EASE }}>
            <Image src={src} alt={alt} fill sizes={sizes} preload={priority} unoptimized={src.startsWith("/midia/")} className="object-cover" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
