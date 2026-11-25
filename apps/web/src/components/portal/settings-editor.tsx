"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { startTransition, useActionState, useId, useRef, useState, type FormEvent } from "react";
import { settingsLimits, socialNetworkKeys, socialNetworks, type SettingsResponse, type SiteSettings, type SocialNetwork } from "@hr/shared";
import { saveSettings } from "@/lib/auth/content-actions";
import type { FormState } from "@/lib/auth/shared";
import { Notice, TextField } from "../auth/fields";

const empty: FormState = {};
const card = "panel bg-white p-5 sm:p-6";
const round = "grid size-9 cursor-pointer place-items-center rounded-sm border border-ink/15 transition hover:bg-night hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current";

type ListName = "phones" | "whatsapp" | "social" | "branches";
type Row<L extends ListName> = SiteSettings[L][number];

function Area({ label, value, onChange, error, hint, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; rows?: number }) {
  const id = useId();
  return (
    <div>
      <div className="relative">
        <textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={`field peer resize-y ${error ? "!border-red-500" : ""}`} aria-invalid={error ? true : undefined} />
        <label htmlFor={id} className="field-label">{label}</label>
      </div>
      {hint && <p className="pl-2 pt-1.5 text-xs text-ink/55">{hint}</p>}
      {error && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

export function SettingsEditor({ initial, version }: { initial: SettingsResponse["data"]; version: string | null }) {
  const [data, setData] = useState(initial);
  const [state, action, pending] = useActionState(saveSettings, empty);
  const [dirty, setDirty] = useState(false);
  const [sent, setSent] = useState(0);
  // chave estável por linha, para a animação acompanhar a linha ao mover ou remover
  const keys = useRef(new WeakMap<object, number>());
  const counter = useRef(0);
  const keyOf = (item: object) => {
    if (!keys.current.has(item)) keys.current.set(item, ++counter.current);
    return keys.current.get(item)!;
  };

  if ((state.stamp ?? 0) !== sent) {
    setSent(state.stamp ?? 0);
    if (state.success) setDirty(false);
  }

  // depois de mover ou remover, os erros antigos apontariam para a linha errada
  const [staleErrors, setStaleErrors] = useState(0);
  const errors = staleErrors === (state.stamp ?? 0) && staleErrors ? {} : state.fields ?? {};

  const change = (patch: Partial<SiteSettings>) => {
    setData((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const rowsOf = <L extends ListName>(name: L) => data[name] as Row<L>[];
  const setRows = <L extends ListName>(name: L, rows: Row<L>[], reordered = false) => {
    change({ [name]: rows } as Partial<SiteSettings>);
    if (reordered) setStaleErrors(state.stamp ?? 0);
  };
  const edit = <L extends ListName>(name: L, index: number, patch: Partial<Row<L>>) =>
    setRows(name, rowsOf(name).map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, ...patch };
      keys.current.set(next, keyOf(row));
      return next;
    }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData();
    form.set("data", JSON.stringify(data));
    form.set("version", version ?? "");
    setStaleErrors(0);
    startTransition(() => action(form));
  };

  const field = <L extends ListName>(name: L, index: number, key: keyof Row<L> & string, label: string, max: number, extra: { type?: string; placeholder?: string; className?: string } = {}) => (
    <TextField label={label} maxLength={max} value={String(rowsOf(name)[index][key])} error={errors[`${name}.${index}.${key}`]}
      onChange={(e) => edit(name, index, { [key]: e.target.value } as Partial<Row<L>>)} {...extra} />
  );

  function List<L extends ListName>(name: L, title: string, hint: string, singular: string, blank: Row<L>, render: (index: number) => React.ReactNode) {
    const rows = rowsOf(name);
    const swap = (from: number, to: number) => {
      const next = [...rows];
      [next[from], next[to]] = [next[to], next[from]];
      setRows(name, next, true);
    };
    return (
      <section className={card} data-list={name}>
        <h2 className="display text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-ink/60">{hint}</p>
        {errors[name] && <p role="alert" className="mt-2 text-sm font-bold text-red-600">{errors[name]}</p>}
        <ul className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {rows.map((row, i) => (
              <motion.li key={keyOf(row)} layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ type: "spring", stiffness: 220, damping: 24 }} className="rounded-sm bg-paper p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="pl-2 text-xs font-extrabold uppercase tracking-wider text-ink/55">{singular} {i + 1}</p>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => swap(i, i - 1)} disabled={i === 0} aria-label={`Subir ${singular} ${i + 1}`} className={round}><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => swap(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Descer ${singular} ${i + 1}`} className={round}><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => setRows(name, rows.filter((_, x) => x !== i), true)} aria-label={`Remover ${singular} ${i + 1}`} className={`${round} text-red-700 hover:!bg-red-600`}><Trash2 className="size-4" /></button>
                  </div>
                </div>
                {render(i)}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {rows.length < settingsLimits[name] && (
          <button type="button" onClick={() => setRows(name, [...rows, { ...blank }])} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-sm border border-ink/20 px-5 py-2.5 text-sm font-extrabold transition hover:bg-night hover:text-white">
            <Plus className="size-4" aria-hidden /> Adicionar {singular}
          </button>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <section className={`${card} space-y-4`}>
        <h2 className="display text-2xl">Dados gerais</h2>
        <TextField label="Frase de boas-vindas (topo da página inicial)" maxLength={160} value={data.welcome} error={errors.welcome} onChange={(e) => change({ welcome: e.target.value })} />
        <TextField label="E-mail de contato" type="email" maxLength={120} value={data.email} error={errors.email} onChange={(e) => change({ email: e.target.value })} />
        <Area label="Endereço (aparece no rodapé)" value={data.address} error={errors.address} hint="Até 4 linhas." onChange={(address) => change({ address })} />
        <TextField label="Link do rastreamento antigo (AMS)" type="url" maxLength={500} value={data.trackingUrl} error={errors.trackingUrl} onChange={(e) => change({ trackingUrl: e.target.value })} />
      </section>

      {List("phones", "Telefones", "Aparecem no rodapé e no Fale Conosco.", "telefone", { label: "", number: "" }, (i) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("phones", i, "label", "Nome (ex.: SAC)", 30)}
          {field("phones", i, "number", "Número com DDD", 20, { type: "tel" })}
        </div>
      ))}

      {List("whatsapp", "WhatsApp", "Aparecem no botão verde flutuante e no Fale Conosco. Sem nenhum número, o botão some.", "WhatsApp", { label: "", description: "", number: "", message: "Oi" }, (i) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("whatsapp", i, "label", "Nome (ex.: COMERCIAL)", 30)}
          {field("whatsapp", i, "number", "Número com DDD", 20, { type: "tel" })}
          {field("whatsapp", i, "description", "Descrição curta", 60)}
          {field("whatsapp", i, "message", "Mensagem que já vem digitada", 200)}
        </div>
      ))}

      {List("social", "Redes sociais", "Ícones no topo e no rodapé do site.", "rede", { network: "instagram", url: "" }, (i) => (
        <div className="grid items-start gap-3 sm:grid-cols-[12rem_1fr]">
          <div>
            <div className="relative">
              <select id={`rede-${i}`} value={data.social[i].network} onChange={(e) => edit("social", i, { network: e.target.value as SocialNetwork })} className="field peer cursor-pointer">
                {socialNetworkKeys.map((key) => <option key={key} value={key}>{socialNetworks[key]}</option>)}
              </select>
              <label htmlFor={`rede-${i}`} className="field-label">Rede</label>
            </div>
            {errors[`social.${i}.network`] && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{errors[`social.${i}.network`]}</p>}
          </div>
          {field("social", i, "url", "Link do perfil", 500, { type: "url", placeholder: "https://" })}
        </div>
      ))}

      {List("branches", "Unidades", "Cartões da página Onde Estamos. O mapa desenhado na página inicial não muda.", "unidade", { city: "", email: "", address: "", cep: "", phone: "", corporate: "", support: "" }, (i) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("branches", i, "city", "Cidade (ex.: Manaus – AM)", 60)}
          {field("branches", i, "email", "E-mail", 120, { type: "email" })}
          {field("branches", i, "address", "Endereço (opcional)", 200, { className: "sm:col-span-2" })}
          {field("branches", i, "cep", "CEP (opcional)", 9)}
          {field("branches", i, "phone", "Telefone", 20, { type: "tel" })}
          {field("branches", i, "corporate", "Corporativo (opcional)", 20, { type: "tel" })}
          {field("branches", i, "support", "Pontos de apoio, separados por vírgula (opcional)", 300)}
        </div>
      ))}

      <div className="sticky bottom-3 z-20 space-y-3 rounded-sm bg-night/95 p-3">
        {/* sobre a barra escura, o aviso precisa de fundo opaco */}
        <div className="[&_p:not([role])]:!bg-leaf"><Notice error={state.error} success={dirty ? undefined : state.success} stamp={state.stamp} /></div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="pl-3 text-sm font-semibold text-white/75">{dirty ? "Há alterações não salvas." : "As mudanças aparecem no site ao salvar."}</p>
          <button type="submit" disabled={pending} className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-leaf px-7 py-3 font-extrabold text-night transition hover:bg-white disabled:cursor-wait disabled:opacity-60">
            <Save className="size-5" aria-hidden /> {pending ? "Salvando..." : "Salvar tudo"}
          </button>
        </div>
      </div>
    </form>
  );
}
