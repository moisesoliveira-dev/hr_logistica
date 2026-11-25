"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { MIN_PASSWORD } from "@hr/shared";
import { strengthOf } from "./strength";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function TextField({ label, error, className = "", ...props }: InputProps) {
  const id = useId();
  return (
    <div className={className}>
      <div className="relative">
        <input id={id} {...props} className={`field peer ${error ? "!border-red-500" : ""}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
        <label htmlFor={id} className="field-label">{label}</label>
      </div>
      {error && <p id={`${id}-error`} className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, meter = false, ...props }: InputProps & { meter?: boolean }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const [value, setValue] = useState("");
  const strength = strengthOf(value);
  return (
    <div>
      <div className="relative">
        <input
          id={id} {...props} type={visible ? "text" : "password"} maxLength={128}
          className={`field peer !pr-14 ${error ? "!border-red-500" : ""}`}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setValue(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          onBlur={() => setCaps(false)}
        />
        <label htmlFor={id} className="field-label">{label}</label>
        <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center overflow-hidden rounded-xl text-ink/60 hover:bg-leaf/25 hover:text-night">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(visible)} initial={{ y: 18, rotate: 40 }} animate={{ y: 0, rotate: 0 }} exit={{ y: -18 }} transition={{ duration: 0.15 }}>
              {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      {caps && <p className="pl-2 pt-1.5 text-sm font-bold text-amber-700" role="status">Caps Lock está ligado.</p>}
      {error && <p id={`${id}-error`} className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
      {meter && (
        <div className="px-1 pt-2">
          <div className="grid grid-cols-4 gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                <motion.span className={`block h-full origin-left ${strength.score <= 1 ? "bg-red-500" : strength.score === 2 ? "bg-amber-500" : "bg-brand"}`} initial={{ scaleX: 0 }} animate={{ scaleX: strength.score >= step ? 1 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} />
              </span>
            ))}
          </div>
          <p className="pt-1.5 text-xs font-semibold text-ink/60">
            {value ? `Força: ${strength.label}.` : ""} Mínimo de {MIN_PASSWORD} caracteres. Uma frase longa funciona muito bem.
          </p>
        </div>
      )}
    </div>
  );
}

export function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <motion.button type="submit" disabled={pending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="btn-primary group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full bg-brand py-4 text-base font-extrabold text-white disabled:cursor-wait disabled:opacity-70">
      <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-night transition-transform duration-500 ease-out group-hover:scale-x-100" />
      <span className="relative">{pending ? "Aguarde..." : children}</span>
      {pending
        ? <LoaderCircle className="relative size-5 animate-spin" aria-hidden />
        : <ArrowRight className="relative size-5 transition duration-500 group-hover:translate-x-2" aria-hidden />}
    </motion.button>
  );
}

/** Aviso de erro (balança) ou de sucesso (salta). */
export function Notice({ error, success, stamp }: { error?: string; success?: string; stamp?: number }) {
  return (
    <div aria-live="polite">
      <AnimatePresence mode="wait">
        {error && (
          <motion.p key={`e-${stamp}`} role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -14, 12, -8, 5, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <CircleAlert className="size-5 shrink-0" aria-hidden />{error}
          </motion.p>
        )}
        {!error && success && (
          <motion.p key={`s-${stamp}`} className="flex items-start gap-3 rounded-2xl bg-leaf/30 p-4 text-sm font-bold text-night" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
            <CircleCheck className="size-5 shrink-0 text-brand-deep" aria-hidden />{success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
