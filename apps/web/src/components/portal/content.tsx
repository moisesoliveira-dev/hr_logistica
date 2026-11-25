"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { MediaItem, PostItem } from "@hr/shared";
import { manageImage, savePost, uploadImage } from "@/lib/auth/content-actions";
import type { FormState } from "@/lib/auth/shared";
import { Notice, SubmitButton, TextField } from "../auth/fields";
import { useConfirmSubmit } from "../confirm";

const empty: FormState = {};
const src = (id: string) => `/portal/midia/${id}`;

/* ───────── imagens ───────── */

export function ImageUploader() {
  const [state, action] = useActionState(uploadImage, empty);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <form action={action} className="space-y-4 panel bg-white p-5" key={state.success ? state.stamp : "form"}>
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      <label className="group relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-sm border-2 border-dashed border-ink/20 bg-paper text-center transition hover:border-brand hover:bg-leaf/10">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}><UploadCloud className="size-12 text-brand" aria-hidden /></motion.span>
            <span className="font-bold">Clique para escolher uma imagem</span>
            <span className="text-sm text-ink/55">JPG, PNG ou WEBP, até 8 MB</span>
          </>
        )}
        <input type="file" name="file" required data-label="Imagem" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }} />
      </label>
      <TextField label="Descrição da imagem (para acessibilidade)" name="alt" maxLength={300} />
      <SubmitButton>Enviar imagem</SubmitButton>
    </form>
  );
}

function ImageCard({ item }: { item: MediaItem }) {
  const [state, action, pending] = useActionState(manageImage, empty);
  const confirmSubmit = useConfirmSubmit();
  return (
    <motion.li layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-sm bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src(item.id)} alt={item.alt} loading="lazy" className="aspect-video w-full object-cover" />
      <form action={action} className="space-y-2 p-3">
        <input type="hidden" name="id" value={item.id} />
        <p className="truncate text-xs text-ink/55" title={item.filename}>{item.filename} · {(item.size / 1024).toFixed(0)} KB</p>
        <input name="alt" defaultValue={item.alt} placeholder="Descrição" maxLength={300} aria-label="Descrição da imagem" className="w-full rounded-sm border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand" />
        <div className="flex gap-2">
          <button name="intent" value="alt" disabled={pending} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm bg-night py-2 text-xs font-extrabold text-white hover:bg-brand"><Check className="size-3.5" aria-hidden /> Salvar</button>
          <button name="intent" value="delete" disabled={pending} onClick={confirmSubmit({ title: "Remover esta imagem?", message: `“${item.filename}” sai do acervo. Notícias que a usam ficarão sem capa.`, action: "Remover imagem" })} aria-label="Remover imagem" className="grid size-8 cursor-pointer place-items-center rounded-sm border border-red-300 text-red-700 hover:bg-red-600 hover:text-white"><Trash2 className="size-4" /></button>
        </div>
        {(state.error || state.success) && <p className={`text-xs font-bold ${state.error ? "text-red-600" : "text-brand-deep"}`}>{state.error ?? state.success}</p>}
      </form>
    </motion.li>
  );
}

export function ImageLibrary({ items }: { items: MediaItem[] }) {
  if (!items.length) return <p className="text-center text-ink/55">Nenhuma imagem enviada ainda.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <ImageCard key={item.id} item={item} />)}
    </ul>
  );
}

/* ───────── notícias ───────── */

type PickerProps = {
  media: MediaItem[];
  /** imagem do acervo já escolhida */
  value: string;
  name?: string;
  label?: string;
  choose?: string;
  change?: string;
  clear?: string;
  /** foto que já vinha no site */
  fallback?: string | null;
  /** permite ficar sem imagem */
  removable?: boolean;
  error?: string;
};

export function ImagePicker({ media, value, name = "coverId", label = "Imagem de capa", choose = "Escolher capa", change = "Trocar capa", clear = "Sem capa", fallback, removable = true, error }: PickerProps) {
  const [selected, setSelected] = useState(value);
  const [removed, setRemoved] = useState(false);
  const [open, setOpen] = useState(false);
  const preview = selected ? src(selected) : removed ? null : fallback;
  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      {removed && <input type="hidden" name="removeImage" value="1" />}
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/55">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-24 w-40 place-items-center overflow-hidden rounded-sm bg-paper">
          {preview
            ? <img src={preview} alt="" className="size-full object-cover" /> // eslint-disable-line @next/next/no-img-element
            : <ImagePlus className="size-8 text-ink/30" aria-hidden />}
        </div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="cursor-pointer rounded-sm border border-ink/20 px-4 py-2 text-sm font-extrabold hover:bg-night hover:text-white">
          {preview ? change : choose}
        </button>
        {removable && preview && <button type="button" onClick={() => { setSelected(""); setRemoved(true); }} className="cursor-pointer text-sm font-bold text-red-700 underline">{clear}</button>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-sm bg-paper p-2 sm:grid-cols-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {media.length === 0 && <li className="col-span-full p-4 text-center text-sm text-ink/55">Envie imagens na página Imagens.</li>}
            {media.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => { setSelected(m.id); setRemoved(false); setOpen(false); }} aria-label={`Usar ${m.alt || m.filename}`} className={`block w-full cursor-pointer overflow-hidden rounded-sm ${m.id === selected ? "ring-4 ring-brand" : "hover:opacity-80"}`}>
                  <img src={src(m.id)} alt="" loading="lazy" className="aspect-video w-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {error && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

/** Mostra como a notícia vai ficar, com o que está digitado agora (sem salvar). */
function Preview({ draft, onClose }: { draft: { title: string; excerpt: string; body: string; coverId: string }; onClose: () => void }) {
  const paragraphs = draft.body.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} onClose={onClose} aria-label="Pré-visualização da notícia" data-lenis-prevent className="m-auto max-h-[90svh] w-[min(52rem,94vw)] overflow-y-auto rounded-sm bg-paper text-ink backdrop:bg-night/80">
      <motion.div initial={{ opacity: 0, y: 60, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 18 }}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-night px-6 py-3 text-white">
          <p className="text-sm font-bold">Pré-visualização: ainda não foi salva</p>
          <button type="button" onClick={() => dialog.current?.close()} className="cursor-pointer rounded-sm bg-white px-4 py-2 text-sm font-extrabold text-night hover:bg-leaf">Fechar</button>
        </div>
        {draft.coverId && <img src={src(draft.coverId)} alt="" className="aspect-video w-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */}
        <article className="space-y-4 p-6 sm:p-10">
          <h2 className="display text-3xl sm:text-4xl">{draft.title || "Sem título"}</h2>
          <p className="text-lg font-semibold text-ink/65">{draft.excerpt}</p>
          {paragraphs.map((t, i) => <p key={i} className="whitespace-pre-line text-lg leading-relaxed">{t}</p>)}
        </article>
      </motion.div>
    </dialog>
  );
}

export function PostEditor({ post, media, saved }: { post?: PostItem; media: MediaItem[]; saved?: boolean }) {
  const [state, action, pending] = useActionState(savePost, saved ? { success: "Salvo.", stamp: 1 } : empty);
  const v = state.values;
  const form = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<Parameters<typeof Preview>[0]["draft"] | null>(null);
  const openPreview = () => {
    const data = new FormData(form.current!);
    const read = (name: string) => String(data.get(name) ?? "");
    setDraft({ title: read("title"), excerpt: read("excerpt"), body: read("body"), coverId: read("coverId") });
  };
  const area = "field peer min-h-32 resize-y";
  return (
    <>
    {draft && <Preview draft={draft} onClose={() => setDraft(null)} />}
    <form ref={form} action={action} className="space-y-4 panel bg-white p-6">
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      {post && <input type="hidden" name="id" value={post.id} />}
      <div key={state.stamp ?? 0} className="space-y-4">
        <TextField label="Título" name="title" required maxLength={200} defaultValue={v?.title ?? post?.title} error={state.fields?.title} />
        <div>
          <div className="relative">
            <textarea id="excerpt" name="excerpt" required maxLength={400} rows={2} defaultValue={v?.excerpt ?? post?.excerpt} className={`${area} !min-h-20`} />
            <label htmlFor="excerpt" className="field-label">Resumo (aparece na lista)</label>
          </div>
          {state.fields?.excerpt && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{state.fields.excerpt}</p>}
        </div>
        <div>
          <div className="relative">
            <textarea id="body" name="body" required rows={12} defaultValue={v?.body ?? post?.body} className={area} />
            <label htmlFor="body" className="field-label">Texto da notícia</label>
          </div>
          <p className="pl-2 pt-1.5 text-xs text-ink/55">Deixe uma linha em branco para separar os parágrafos.</p>
          {state.fields?.body && <p className="pl-2 text-sm font-bold text-red-600">{state.fields.body}</p>}
        </div>
        <ImagePicker media={media} value={v?.coverId ?? post?.coverId ?? ""} />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button name="intent" value="publicar" disabled={pending} className="cursor-pointer rounded-sm bg-brand px-7 py-3.5 font-extrabold text-white transition hover:bg-night disabled:opacity-60">
          {post?.status === "publicado" ? "Salvar e manter no ar" : "Publicar no site"}
        </button>
        <button name="intent" value="rascunho" disabled={pending} className="cursor-pointer rounded-sm border border-ink/20 px-7 py-3.5 font-extrabold transition hover:bg-paper disabled:opacity-60">
          {post?.status === "publicado" ? "Tirar do ar (rascunho)" : "Salvar rascunho"}
        </button>
        <button type="button" onClick={openPreview} className="cursor-pointer rounded-sm px-5 py-3.5 font-extrabold text-brand-deep underline underline-offset-4 hover:text-night">
          Pré-visualizar
        </button>
      </div>
    </form>
    </>
  );
}
