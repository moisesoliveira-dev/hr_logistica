"use client";

import { motion } from "motion/react";
import { Check, Copy, Trash2 } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { DONE_STAGE, formatDocument, type CargoDetail, type CargoEvent, type CargoOptions } from "@hr/shared";
import { addCargoEvent, deleteCargo, removeCargoEvent, saveCargo } from "@/lib/auth/cargo-actions";
import { formatDate, type FormState } from "@/lib/auth/shared";
import { Notice, SubmitButton, TextField } from "../auth/fields";
import { useConfirmSubmit } from "../confirm";
import { Combobox } from "./combobox";

const empty: FormState = {};
const card = "panel bg-white p-5 sm:p-6";

const placeHelp = "Nenhum local ou cidade com esse nome. Será salvo como você digitou.";

function Select({ label, name, defaultValue, options, error }: { label: string; name: string; defaultValue: string; options: [string, string][]; error?: string }) {
  const id = useId();
  return (
    <div className="relative">
      <select id={id} name={name} defaultValue={defaultValue} className="field peer cursor-pointer">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      <label htmlFor={id} className="field-label">{label}</label>
      {error && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

/** Escolher um cliente já cadastrado preenche o CNPJ/CPF sozinho. */
function CustomerFields({ name, document, fields }: { name: string; document: string; fields?: Record<string, string> }) {
  const [number, setNumber] = useState(document);
  return (
    <>
      <Combobox label="Cliente (nome ou CNPJ/CPF)" name="customerName" source="clientes" required maxLength={150} defaultValue={name} error={fields?.customerName} emptyText="Cliente novo: ele entra no cadastro quando a carga for salva." onPick={(s) => setNumber(s.extra ?? "")} />
      <TextField label="CNPJ ou CPF do cliente" name="customerDocument" required maxLength={20} value={number} onChange={(e) => setNumber(e.target.value)} error={fields?.customerDocument} />
    </>
  );
}

/** Remonta os campos depois de cada envio: assim o que foi digitado volta quando há erro. */
function useFormVersion(state: FormState) {
  const [seen, setSeen] = useState({ stamp: 0, version: 0 });
  if ((state.stamp ?? 0) !== seen.stamp) setSeen({ stamp: state.stamp ?? 0, version: seen.version + 1 });
  return seen.version;
}

export function CargoForm({ cargo, options }: { cargo?: CargoDetail; options: CargoOptions }) {
  const [state, action] = useActionState(saveCargo, empty);
  const version = useFormVersion(state);
  const v = state.values;
  const value = (key: "invoice" | "customerName" | "origin" | "destination" | "expectedAt") => v?.[key] ?? cargo?.[key] ?? "";
  // transporte desativado só aparece na carga que já o usa
  const modes = options.modes.filter((m) => m.active || m.key === cargo?.mode.key);
  return (
    <form action={action} className={`${card} space-y-4`}>
      <h2 className="display text-2xl">Dados da carga</h2>
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      {cargo && <input type="hidden" name="id" value={cargo.id} />}
      <div key={version} className="grid gap-4 sm:grid-cols-2">
        <CustomerFields name={value("customerName")} document={v?.customerDocument ?? (cargo ? formatDocument(cargo.customerDocument) : "")} fields={state.fields} />
        <Combobox label="Origem" name="origin" source="lugares" required maxLength={120} defaultValue={value("origin")} error={state.fields?.origin} emptyText={placeHelp} />
        <Combobox label="Destino" name="destination" source="lugares" required maxLength={120} defaultValue={value("destination")} error={state.fields?.destination} emptyText={placeHelp} />
        <Select label="Transporte" name="mode" defaultValue={v?.mode ?? cargo?.mode.key ?? modes[0]?.key ?? ""} options={modes.map((m) => [m.key, m.name])} error={state.fields?.mode} />
        <TextField label="Previsão de entrega (opcional)" name="expectedAt" type="date" defaultValue={value("expectedAt")} error={state.fields?.expectedAt} />
        <TextField label="Nota fiscal (opcional)" name="invoice" maxLength={60} defaultValue={value("invoice")} error={state.fields?.invoice} />
      </div>
      <SubmitButton>{cargo ? "Salvar dados" : "Cadastrar carga"}</SubmitButton>
    </form>
  );
}

export function CargoEventForm({ cargo, options }: { cargo: CargoDetail; options: CargoOptions }) {
  const [state, action] = useActionState(addCargoEvent, empty);
  const version = useFormVersion(state);
  const noteId = useId();
  const v = state.values;
  const stages = options.stages.filter((s) => s.active);
  // sugere a etapa seguinte à última do caminho normal (uma ocorrência não conta)
  const path = options.stages.filter((s) => s.kind !== "ocorrencia");
  const reached = cargo.events.find((e) => e.stage.kind !== "ocorrencia")?.stage.key;
  const next = path.slice(path.findIndex((s) => s.key === reached) + 1).find((s) => s.active)?.key ?? DONE_STAGE;
  return (
    <form action={action} className={`${card} space-y-4 ring-2 ring-brand/30`}>
      <h2 className="display text-2xl">Registrar andamento</h2>
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      <input type="hidden" name="id" value={cargo.id} />
      <div key={version} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Etapa" name="stage" defaultValue={state.error ? v?.stage ?? next : next} options={stages.map((s) => [s.key, s.kind === "ocorrencia" ? `⚠ ${s.name}` : s.name])} error={state.fields?.stage} />
          <Combobox label="Local (cidade, terminal...)" name="location" source="lugares" required maxLength={120} defaultValue={state.error ? v?.location : ""} error={state.fields?.location} emptyText={placeHelp} />
          <TextField label="Quando (em branco = agora)" name="at" type="datetime-local" defaultValue={state.error ? v?.at : ""} error={state.fields?.at} />
        </div>
        <div>
          <div className="relative">
            <textarea id={noteId} name="note" rows={2} maxLength={500} defaultValue={state.error ? v?.note : ""} className="field peer min-h-20 resize-y" />
            <label htmlFor={noteId} className="field-label">Observação — o cliente vê este texto</label>
          </div>
          {state.fields?.note && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{state.fields.note}</p>}
        </div>
      </div>
      <p className="text-xs text-ink/55">Horário de Manaus.</p>
      <SubmitButton>Registrar andamento</SubmitButton>
    </form>
  );
}

export function CargoHistory({ cargoId, events }: { cargoId: number; events: CargoEvent[] }) {
  const [state, action, pending] = useActionState(removeCargoEvent, empty);
  const confirmSubmit = useConfirmSubmit();
  return (
    <section className={card}>
      <h2 className="display mb-4 text-2xl">Histórico</h2>
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      <ul className="divide-y divide-ink/10">
        {events.map((event) => (
          <motion.li layout key={event.id} className="flex items-start gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{event.stage.name} · {event.location}</p>
              <p className="text-sm text-ink/55">{formatDate(event.at)} · lançado por {event.createdBy}</p>
              {event.note && <p className="mt-1 whitespace-pre-line break-words text-sm">{event.note}</p>}
            </div>
            {events.length > 1 && (
              <form action={action}>
                <input type="hidden" name="id" value={cargoId} />
                <input type="hidden" name="eventId" value={event.id} />
                <button disabled={pending} onClick={confirmSubmit({ title: "Remover esta etapa?", message: `“${event.stage.name}” em ${event.location} sai do histórico que o cliente vê. Use apenas para corrigir um lançamento errado.`, action: "Remover etapa" })} aria-label={`Remover etapa ${event.stage.name}`} className="grid size-9 cursor-pointer place-items-center rounded-sm border border-red-300 text-red-700 hover:bg-red-600 hover:text-white"><Trash2 className="size-4" /></button>
              </form>
            )}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/** Texto pronto para mandar ao cliente. */
export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const link = `${window.location.origin}/rastreamento?codigo=${code}`;
    await navigator.clipboard.writeText(`Acompanhe sua carga ${code}: ${link} (informe o CNPJ ou CPF do cadastro)`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button type="button" onClick={copy} className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand">
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? "Copiado!" : "Copiar mensagem para o cliente"}</span>
    </button>
  );
}

export function DeleteCargo({ id, code }: { id: number; code: string }) {
  const confirmSubmit = useConfirmSubmit();
  return (
    <form action={deleteCargo} className="text-right">
      <input type="hidden" name="id" value={id} />
      <button onClick={confirmSubmit({ title: "Excluir esta carga?", message: `A carga ${code} e todo o histórico serão apagados. O cliente não conseguirá mais consultá-la.`, action: "Excluir carga" })} className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-red-300 px-5 py-3 text-sm font-extrabold text-red-700 hover:bg-red-600 hover:text-white">
        <Trash2 className="size-4" aria-hidden /> Excluir carga
      </button>
    </form>
  );
}
