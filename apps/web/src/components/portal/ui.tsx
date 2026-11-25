"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

// cada área do portal tem uma foto da operação no cabeçalho
const photos: [string, string][] = [
  ["/portal/cargas", "/fotos/frota-03.jpg"],
  ["/portal/conteudo/noticias", "/fotos/sede-04.jpg"],
  ["/portal/conteudo/imagens", "/fotos/armazem-03.jpg"],
  ["/portal/conteudo/site", "/fotos/sede-02.jpg"],
  ["/portal/conteudo/contatos", "/fotos/sede-01.jpg"],
  ["/portal/usuarios", "/fotos/armazem-02.jpg"],
  ["/portal/auditoria", "/fotos/armazem-01.jpg"],
  ["/portal/perfil", "/fotos/sede-05.jpg"],
  ["/portal", "/fotos/sede-03.jpg"],
];

/** Cabeçalho de ponta a ponta: foto, título grande e a faixa da marca. */
export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  const photo = photos.find(([path]) => pathname.startsWith(path))?.[1] ?? "/fotos/sede-03.jpg";
  return (
    <header className="relative mx-[calc(50%-50vw)] mb-10 overflow-hidden bg-night text-white">
      <motion.div className="absolute inset-0" initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
        <Image src={photo} alt="" fill preload sizes="100vw" className="object-cover" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-night/75" />
      {/* alto só quando há conteúdo extra (Início); nas telas de trabalho, o cabeçalho é mais baixo */}
      <div className={`relative mx-auto flex max-w-6xl flex-col justify-end gap-5 px-5 sm:px-8 ${children ? "min-h-52 py-8 sm:min-h-64" : "min-h-36 py-5 sm:min-h-44"}`}>
        <div>
          <p className="inline-block bg-leaf px-3 py-1 text-xs font-bold uppercase tracking-widest text-night first-letter:uppercase">{eyebrow}</p>
          <h1 className="mt-3 overflow-hidden pb-1">
            <motion.span className="display block break-words text-4xl uppercase sm:text-6xl" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>{title}</motion.span>
          </h1>
        </div>
        {children}
      </div>
      <motion.div aria-hidden className="relative h-2 origin-left bg-brand" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.35, ease: [0.76, 0, 0.24, 1] }} />
    </header>
  );
}

/** Painel chapado, com a faixa verde no topo. */
export function Card({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={`panel bg-white p-6 ${className}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
