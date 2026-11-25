"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { LoaderCircle, Paperclip, RefreshCw, Send, Truck } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { applyMask, FILE_EXTENSIONS, forms, validateField, validateFile, type Field, type FormKind } from "@hr/shared";
import { EASE } from "./motion";

type Errors = Record<string, string>;

function ErrorText({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p id={id} className="overflow-hidden pl-2 text-sm font-bold text-red-600" initial={{ height: 0, x: -30, opacity: 0 }} animate={{ height: "auto", x: 0, opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <span className="block pt-1.5">{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Control({ field, error, onEdit }: { field: Field; error?: string; onEdit: (name: string) => void }) {
  const [fileName, setFileName] = useState("");
  const id = `f-${field.name}`;
  const common = {
    id, name: field.name, required: field.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  const label = `${field.label}${field.required ? " *" : ""}`;
  const cls = `field peer ${error ? "!border-red-500" : ""}`;

  if (field.type === "file") {
    return (
      <label className={`relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed bg-white p-4 transition focus-within:border-brand hover:border-brand hover:bg-leaf/10 ${error ? "border-red-500" : "border-ink/20"}`}>
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-leaf/30 text-brand-deep"><Paperclip className="size-5" aria-hidden /></span>
        <span className="min-w-0">
          <span className="block truncate font-bold">{fileName || field.label}</span>
          <span className="text-xs text-ink/55">Tipos de arquivos permitidos: {FILE_EXTENSIONS.join(", ")} (máx. 5 MB)</span>
        </span>
        <input {...common} type="file" accept={FILE_EXTENSIONS.map((e) => `.${e}`).join(",")} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => { setFileName(e.target.files?.[0]?.name ?? ""); onEdit(field.name); }} />
      </label>
    );
  }

  return (
    <div className="relative">
      {field.type === "textarea" ? (
        <textarea {...common} rows={5} maxLength={5000} className={`${cls} resize-y`} onChange={() => onEdit(field.name)} />
      ) : field.type === "select" ? (
        <select {...common} defaultValue="" className={`${cls} cursor-pointer`} onChange={() => onEdit(field.name)}>
          <option value="" disabled>Selecione</option>
          {field.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          {...common}
          type={field.type ?? "text"}
          autoComplete={field.autoComplete}
          maxLength={200}
          min={field.type === "number" ? 0 : undefined}
          step={field.type === "number" ? "any" : undefined}
          inputMode={field.mask === "phone" ? "tel" : field.type === "number" ? "decimal" : undefined}
          className={cls}
          onChange={(e) => { if (field.mask) e.target.value = applyMask(field.mask, e.target.value); onEdit(field.name); }}
        />
      )}
      <label htmlFor={id} className="field-label">{label}</label>
    </div>
  );
}

export function SmartForm({ kind, submitLabel }: { kind: FormKind; submitLabel: string }) {
  const fields: Field[] = forms[kind];
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ simulated?: boolean } | null>(null);
  const [captcha, setCaptcha] = useState<{ token: string; image: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const shake = useAnimationControls();

  const loadCaptcha = useCallback(async () => {
    setCaptcha(null);
    const input = formRef.current?.elements.namedItem("captcha") as HTMLInputElement | null;
    if (input) input.value = "";
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setCaptcha(await res.json());
    } catch {
      setMessage("Não foi possível carregar o código de segurança. Clique em atualizar.");
    }
  }, []);

  useEffect(() => { if (!sent) loadCaptcha(); }, [sent, loadCaptcha]);
  useEffect(() => { if (sent) successRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [sent]);

  function onEdit(name: string) {
    setErrors((e) => { const { [name]: _, ...rest } = e; return rest; });
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const required = fields.filter((f) => f.required);
    setProgress(required.filter((f) => String(data.get(f.name) ?? "").trim()).length / required.length);
  }

  function reject(next: Errors, text: string) {
    setErrors(next);
    setMessage(text);
    shake.start({ x: [0, -16, 14, -10, 7, -3, 0], transition: { duration: 0.5 } });
    const first = Object.keys(next)[0];
    (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const data = new FormData(event.currentTarget);
    const found: Errors = {};
    for (const field of fields) {
      const value = data.get(field.name);
      const problem = field.type === "file"
        ? value instanceof File && value.size > 0 ? validateFile(value) : null
        : validateField(field, String(value ?? ""));
      if (problem) found[field.name] = problem;
    }
    if (!String(data.get("captcha") ?? "").trim()) found.captcha = "Digite o código da imagem.";
    if (Object.keys(found).length) return reject(found, "Revise os campos destacados.");

    data.set("captchaToken", captcha?.token ?? "");
    setSending(true);
    setMessage("");
    try {
      const res = await fetch(`/api/${kind}`, { method: "POST", body: data });
      const result = await res.json();
      if (result.ok) {
        setSent(result);
        setProgress(0);
      } else {
        reject(result.errors ?? {}, result.error);
        loadCaptcha();
      }
    } catch {
      reject({}, "Falha de conexão. Tente novamente.");
      loadCaptcha();
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div ref={successRef} role="status" className="overflow-hidden rounded-[2.5rem] bg-night p-10 text-center text-white sm:p-16" initial={{ scale: 0.7, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 160, damping: 15 }}>
        <svg viewBox="0 0 100 100" className="mx-auto size-32" aria-hidden>
          <motion.circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-brand)" strokeWidth="7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
          <motion.path d="M29 52l15 15 29-32" fill="none" stroke="var(--color-leaf)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.9 }} />
        </svg>
        <h2 className="display mt-8 text-4xl">Mensagem a caminho!</h2>
        <p className="mt-4 text-white/75">
          {sent.simulated ? "Modo de desenvolvimento: nenhum e-mail foi enviado. Os dados foram salvos na pasta .submissions." : "Recebemos seus dados e em breve nossa equipe entrará em contato."}
        </p>
        <div className="relative my-8 h-12 border-b-2 border-dashed border-white/25" aria-hidden>
          <motion.div className="absolute bottom-1 text-leaf" initial={{ left: "-10%" }} animate={{ left: "110%" }} transition={{ duration: 2.4, delay: 1, ease: EASE }}><Truck className="size-10" /></motion.div>
        </div>
        <button type="button" onClick={() => { setSent(null); setMessage(""); setErrors({}); }} className="cursor-pointer rounded-full bg-leaf px-7 py-3.5 font-extrabold text-night transition hover:scale-105">Enviar outra mensagem</button>
      </motion.div>
    );
  }

  return (
    <motion.div animate={shake}>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <motion.div className="h-full origin-left bg-gradient-to-r from-brand to-leaf" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} transition={{ type: "spring", stiffness: 140, damping: 18 }} />
      </div>
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {fields.map((field, i) => (
          <motion.div key={field.name} className={field.full ? "sm:col-span-2" : ""} initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 130, damping: 16, delay: (i % 4) * 0.06 }}>
            <Control field={field} error={errors[field.name]} onEdit={onEdit} />
            <ErrorText id={`f-${field.name}-error`} message={errors[field.name]} />
          </motion.div>
        ))}

        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />

        <div className="flex flex-wrap items-start gap-3 sm:col-span-2">
          <div className="grid h-14 w-[190px] place-items-center overflow-hidden rounded-xl bg-leaf/25">
            {captcha ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={captcha.image} width={190} height={56} alt="Imagem com o código de segurança de 5 números" />
            ) : <LoaderCircle className="size-5 animate-spin text-brand" aria-label="Carregando código" />}
          </div>
          <motion.button whileTap={{ rotate: 360 }} whileHover={{ rotate: 90 }} type="button" onClick={loadCaptcha} aria-label="Gerar novo código" className="grid size-14 cursor-pointer place-items-center rounded-xl bg-white shadow"><RefreshCw className="size-5" /></motion.button>
          <div className="min-w-48 flex-1">
            <div className="relative">
              <input id="f-captcha" name="captcha" inputMode="numeric" autoComplete="off" maxLength={5} className={`field peer ${errors.captcha ? "!border-red-500" : ""}`} aria-invalid={errors.captcha ? true : undefined} aria-describedby={errors.captcha ? "f-captcha-error" : undefined} onChange={() => onEdit("captcha")} />
              <label htmlFor="f-captcha" className="field-label">Código de Segurança *</label>
            </div>
            <ErrorText id="f-captcha-error" message={errors.captcha} />
          </div>
        </div>

        <p role="alert" className="font-bold text-red-600 empty:hidden sm:col-span-2">{message}</p>

        <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="group relative flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full bg-brand py-5 text-base font-extrabold text-white disabled:cursor-wait disabled:opacity-70 sm:col-span-2">
          <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-night transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <span className="relative">{sending ? "Enviando..." : submitLabel}</span>
          {sending
            ? <LoaderCircle className="relative size-5 animate-spin" aria-hidden />
            : <Send className="relative size-5 transition duration-500 group-hover:-translate-y-1 group-hover:translate-x-2 group-hover:rotate-12" aria-hidden />}
        </motion.button>
      </form>
    </motion.div>
  );
}
