"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { sectionDef, type SiteItem, type SiteSection } from "@hr/shared";
import { manageSiteItem, saveSiteItem } from "@/lib/auth/content-actions";
import type { FormState } from "@/lib/auth/shared";
import { Notice, SubmitButton, TextField } from "../auth/fields";
import { ImagePicker } from "./content";
import { useConfirmSubmit } from "../confirm";

const empty: FormState = {};
const round = "grid size-10 cursor-pointer place-items-center rounded-sm border border-ink/15 transition hover:bg-night hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current";

function ItemForm({ section, item }: { section: SiteSection; item?: SiteItem }) {
  const def = sectionDef(section);
  const [state, action] = useActionState(saveSiteItem, empty);
  // depois de adicionar, o formulário volta em branco; depois de um erro, mantém o que foi digitado
  const [sent, setSent] = useState({ stamp: 0, version: 0 });
  if ((state.stamp ?? 0) !== sent.stamp) setSent({ stamp: state.stamp ?? 0, version: sent.version + 1 });
  const v = state.values;
  const initial = (key: "title" | "subtitle" | "text" | "mediaId") => v?.[key] ?? item?.[key] ?? "";
  return (
    <form action={action} className="space-y-4">
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      <input type="hidden" name="section" value={section} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <div key={sent.version} className="space-y-4">
        <div>
          <ImagePicker value={initial("mediaId")} name="mediaId" label={def.image.label} choose="Escolher imagem" change="Trocar imagem" clear="Sem foto"
            fallback={item?.mediaId ? `/portal/midia/${item.mediaId}` : item?.staticSrc} removable={!def.image.required} error={state.fields?.mediaId} />
          <p className="mt-2 text-xs text-ink/55">{def.image.hint} A imagem não está na lista? <Link href="/portal/conteudo/imagens" className="font-bold text-brand-deep underline">Envie em Imagens</Link>.</p>
        </div>
        <TextField label={def.title.label} name="title" required={def.title.required} maxLength={def.title.max} defaultValue={initial("title")} error={state.fields?.title} />
        {def.subtitle && <TextField label={def.subtitle.label} name="subtitle" required={def.subtitle.required} maxLength={def.subtitle.max} defaultValue={initial("subtitle")} error={state.fields?.subtitle} />}
        {def.text && (
          <div>
            <div className="relative">
              <textarea id={`text-${item?.id ?? "novo"}`} name="text" required={def.text.required} maxLength={def.text.max} rows={5} defaultValue={initial("text")} className="field peer min-h-32 resize-y" />
              <label htmlFor={`text-${item?.id ?? "novo"}`} className="field-label">{def.text.label}</label>
            </div>
            {state.fields?.text && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{state.fields.text}</p>}
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-3 font-bold">
          <input type="checkbox" name="visible" defaultChecked={v ? v.visible === "on" : item?.visible ?? true} className="size-5 accent-brand" /> Mostrar no site
        </label>
      </div>
      <SubmitButton>{item ? "Salvar alterações" : `Adicionar ${def.singular}`}</SubmitButton>
    </form>
  );
}

function Row({ item, first, last, index }: { item: SiteItem; first: boolean; last: boolean; index: number }) {
  const [state, action, pending] = useActionState(manageSiteItem, empty);
  const [editing, setEditing] = useState(false);
  const def = sectionDef(item.section);
  const name = item.title || `${def.singular[0].toUpperCase()}${def.singular.slice(1)} ${index + 1}`;
  const image = item.mediaId ? `/portal/midia/${item.mediaId}` : item.staticSrc;
  const confirmSubmit = useConfirmSubmit();
  return (
    <motion.li layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="rounded-sm bg-white p-4" data-item={name}>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-sm bg-paper ${item.visible ? "" : "opacity-40"}`}>
          {image
            ? <img src={image} alt="" loading="lazy" className={`size-full ${item.section === "clientes" ? "object-contain p-1" : "object-cover"}`} /> // eslint-disable-line @next/next/no-img-element
            : <span className="font-display text-xl font-extrabold text-brand" aria-hidden>{name[0]}</span>}
        </div>
        <div className="min-w-40 flex-1">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate text-sm text-ink/55">{item.subtitle || item.text || (item.visible ? "No ar" : "")}</p>
          {!item.visible && <p className="mt-1 inline-flex items-center gap-1 rounded-sm bg-ink/10 px-3 py-0.5 text-xs font-extrabold text-ink/60"><EyeOff className="size-3" aria-hidden /> Oculto</p>}
        </div>
        <form action={action} className="flex gap-2">
          <input type="hidden" name="id" value={item.id} />
          <button name="intent" value="up" disabled={pending || first} aria-label={`Subir ${name}`} className={round}><ArrowUp className="size-4" /></button>
          <button name="intent" value="down" disabled={pending || last} aria-label={`Descer ${name}`} className={round}><ArrowDown className="size-4" /></button>
          <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} aria-label={`Editar ${name}`} className={round}>{editing ? <X className="size-4" /> : <Pencil className="size-4" />}</button>
          <button name="intent" value="delete" disabled={pending} onClick={confirmSubmit({ title: "Remover do site?", message: `“${name}” deixa de aparecer. A imagem continua no acervo.`, action: "Remover" })} aria-label={`Remover ${name}`} className={`${round} text-red-700 hover:!bg-red-600`}><Trash2 className="size-4" /></button>
        </form>
      </div>
      {state.error && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{state.error}</p>}
      <AnimatePresence>
        {editing && (
          <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="mt-4 border-t border-ink/10 pt-5"><ItemForm section={item.section} item={item} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function SectionManager({ section, items }: { section: SiteSection; items: SiteItem[] }) {
  const def = sectionDef(section);
  const [adding, setAdding] = useState(false);
  const visible = items.filter((i) => i.visible).length;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setAdding(!adding)} aria-expanded={adding} className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-extrabold text-white transition hover:bg-night">
          {adding ? <X className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />} {adding ? "Fechar" : `Adicionar ${def.singular}`}
        </button>
        <p className="text-sm font-semibold text-ink/60">{visible} no ar (máximo {def.maxVisible}). A ordem da lista é a ordem no site.</p>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div className="-mx-2 overflow-hidden px-2" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="mb-6 panel bg-white p-6 ring-2 ring-brand/30"><ItemForm section={section} /></div>
          </motion.div>
        )}
      </AnimatePresence>
      {items.length === 0 && <p className="text-ink/55">Nada por aqui ainda. Enquanto estiver vazio, esta área não aparece no site.</p>}
      <ul className="space-y-3">
        {items.map((item, i) => <Row key={item.id} item={item} index={i} first={i === 0} last={i === items.length - 1} />)}
      </ul>
    </>
  );
}
