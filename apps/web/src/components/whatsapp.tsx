"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import { whatsappHref, type WhatsAppContact } from "@hr/shared";
import { BrandIcon } from "./icons";

export function WhatsApp({ contacts }: { contacts: WhatsAppContact[] }) {
  const [open, setOpen] = useState(false);
  if (!contacts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[55] flex flex-col items-end gap-3" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <AnimatePresence>
        {open && (
          <motion.div
            id="whatsapp-panel"
            data-lenis-prevent className="max-h-[calc(100svh-8rem)] w-[min(21rem,calc(100vw-2.5rem))] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-night/40"
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.3, y: 60, rotate: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.4, y: 40, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 280, damping: 21 }}
          >
            <div className="bg-brand-deep p-5 text-white">
              <p className="font-display text-xl font-extrabold">FALE CONOSCO</p>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-leaf">Atendimento</p>
              <p className="mt-2 text-sm text-white/80">Clique para iniciar atendimento no WhatsApp</p>
            </div>
            <div className="space-y-2 p-4">
              <p className="px-1 text-xs text-ink/60">A equipe normalmente responde em alguns minutos.</p>
              {contacts.map((w, i) => (
                <motion.a
                  key={i}
                  href={whatsappHref(w)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-paper p-3 transition-colors hover:bg-leaf/30"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <span className="grid size-11 place-items-center rounded-full bg-brand text-white"><BrandIcon id="whatsapp" className="size-6" /></span>
                  <span className="flex-1"><strong className="block text-sm">{w.label}</strong><span className="text-xs text-ink/60">{w.description}</span></span>
                  <ArrowUpRight className="size-4 text-brand" aria-hidden />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="whatsapp-panel"
        aria-label={open ? "Fechar atendimento" : "Atendimento por WhatsApp"}
        className="relative grid size-16 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-xl shadow-brand/40"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 2.2, type: "spring", stiffness: 200, damping: 14 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
      >
        {!open && [0, 0.9].map((d) => (
          <motion.span key={d} aria-hidden className="absolute inset-0 rounded-full border-2 border-brand" animate={{ scale: [1, 1.9], opacity: [0.8, 0] }} transition={{ duration: 1.8, delay: d, repeat: Infinity, ease: "easeOut" }} />
        ))}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(open)} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} transition={{ duration: 0.18 }}>
            {open ? <X className="size-7" /> : <BrandIcon id="whatsapp" className="size-8" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
