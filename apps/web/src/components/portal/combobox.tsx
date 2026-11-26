"use client";

import { AnimatePresence, motion } from "motion/react";
import { Building2, LoaderCircle, MapPin, Warehouse } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import type { Suggestion } from "@hr/shared";

type Props = {
  label: string;
  name: string;
  source: "lugares" | "cidades" | "clientes";
  defaultValue?: string;
  maxLength: number;
  required?: boolean;
  error?: string;
  /** o que dizer quando nada combina */
  emptyText: string;
  onPick?: (suggestion: Suggestion) => void;
};

type Result = { query: string; items: Suggestion[]; failed?: boolean };

const icon = (source: Props["source"], detail: string) => (source === "clientes" ? Building2 : detail === "Local cadastrado" ? Warehouse : MapPin);

/** Campo de texto com sugestões do banco enquanto se digita. */
export function Combobox({ label, name, source, defaultValue = "", maxLength, required, error, emptyText, onPick }: Props) {
  const id = useId();
  const listId = `${id}-lista`;
  const [text, setText] = useState(defaultValue);
  // só o que a pessoa digitou é pesquisado: escolher uma sugestão não abre a lista de novo
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const searching = query.trim().length >= 2;

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    // espera uma pausa na digitação antes de consultar
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/portal/busca/${source}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: query }), signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        setResult({ query, items: await response.json() });
      } catch {
        if (!controller.signal.aborted) setResult({ query, items: [], failed: true });
      }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, source]);

  const items = searching ? result?.items ?? [] : [];
  const waiting = searching && result?.query !== query;
  const shown = open && searching;

  const pick = (suggestion: Suggestion) => {
    setText(suggestion.value);
    setQuery("");
    setResult(null);
    setOpen(false);
    setActive(-1);
    onPick?.(suggestion);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!items.length) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current < 0 && step < 0 ? items.length - 1 : (current + step + items.length) % items.length));
    } else if (event.key === "Enter" && shown && items[active]) {
      // Enter escolhe a sugestão marcada; sem nenhuma marcada, envia o formulário como sempre
      event.preventDefault();
      pick(items[active]);
    } else if (event.key === "Escape" && shown) {
      event.preventDefault();
      setOpen(false);
    }
  };

  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  return (
    <div>
      <div className="relative">
        <input
          id={id} name={name} value={text} required={required} maxLength={maxLength} autoComplete="off"
          role="combobox" aria-expanded={shown} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={shown && items[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          className={`field peer !pr-11 ${error ? "!border-red-500" : ""}`}
          onChange={(e) => { setText(e.target.value); setQuery(e.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        <label htmlFor={id} className="field-label">{label}</label>
        {shown && waiting && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand" aria-hidden />}

        <AnimatePresence>
          {shown && (items.length > 0 || !waiting) && (
            <motion.div
              className="absolute inset-x-0 top-full z-30 mt-1 border border-ink/15 border-t-4 border-t-brand bg-white shadow-xl shadow-night/15"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}
              // segura o foco no campo para o clique na sugestão acontecer
              onMouseDown={(e) => e.preventDefault()}
            >
              <ul id={listId} role="listbox" aria-label={`Sugestões para ${label}`} data-lenis-prevent className="max-h-64 overflow-y-auto">
                {items.map((item, i) => {
                  const Icon = icon(source, item.detail);
                  return (
                    <li key={`${item.detail}|${item.label}`} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => pick(item)} className={`flex cursor-pointer items-start gap-2.5 px-3 py-2.5 ${i === active ? "bg-leaf/30" : ""}`}>
                      <Icon className="mt-0.5 size-4 shrink-0 text-brand-deep" aria-hidden />
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-bold leading-tight">{item.label}</span>
                        <span className="block text-xs text-ink/55">{item.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {!waiting && items.length === 0 && <p role="status" className="px-3 py-3 text-sm text-ink/60">{result?.failed ? "Não foi possível buscar agora." : emptyText}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p id={`${id}-error`} className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
