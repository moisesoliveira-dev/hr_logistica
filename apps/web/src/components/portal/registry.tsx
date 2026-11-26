"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import type { RegistryKey, StageKind } from "@hr/shared";
import { manageRegistry } from "@/lib/auth/registry-actions";
import type { FormState } from "@/lib/auth/shared";
import { Notice, SubmitButton, TextField } from "../auth/fields";
import { useConfirmSubmit } from "../confirm";
import { Combobox } from "./combobox";

const empty: FormState = {};

/** Um item de qualquer cadastro, já pronto para a tela. */
export type Entry = {
  key: string;
  title: string;
  detail: string;
  values: Record<string, string>;
  active?: boolean;
  badge?: string;
  /** etapas do mesmo grupo podem trocar de ordem */
  group?: StageKind;
  /** o que impede a exclusão, em palavras */
  locked?: string;
  /** etapas do sistema só mudam de nome */
  fixed?: boolean;
};

function Fields({ registry, values, state, creating }: { registry: RegistryKey; values: Record<string, string>; state: FormState; creating: boolean }) {
  const v = { ...values, ...(state.error ? state.values : undefined) };
  const name = <TextField label={registry === "locais" ? "Nome do local (ex.: Porto Chibatão)" : "Nome"} name="name" required maxLength={registry === "clientes" ? 150 : registry === "locais" ? 80 : 60} autoComplete="off" defaultValue={v.name} error={state.fields?.name} />;
  if (registry === "clientes") {
    return <div className="grid gap-4 sm:grid-cols-2">{name}<TextField label="CNPJ ou CPF" name="document" required maxLength={20} autoComplete="off" defaultValue={v.document} error={state.fields?.document} /></div>;
  }
  if (registry === "locais") {
    return <div className="grid gap-4 sm:grid-cols-2">{name}<Combobox label="Cidade" name="city" source="cidades" required maxLength={60} defaultValue={v.city} error={state.fields?.city} emptyText="Nenhuma cidade com esse nome." /></div>;
  }
  if (registry === "etapas" && creating) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {name}
        <div>
          <label className="relative block">
            <select name="kind" defaultValue={v.kind ?? "andamento"} className="field peer cursor-pointer">
              <option value="andamento">Em andamento (passo do caminho)</option>
              <option value="ocorrencia">Ocorrência (problema)</option>
            </select>
            <span className="field-label">Tipo</span>
          </label>
          {state.fields?.kind && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{state.fields.kind}</p>}
        </div>
      </div>
    );
  }
  return <>{name}{registry === "etapas" && <input type="hidden" name="kind" value={values.kind} />}</>;
}

function NewEntry({ registry, singular }: { registry: RegistryKey; singular: string }) {
  const [state, action] = useActionState(manageRegistry, empty);
  return (
    <form action={action} className="panel space-y-4 bg-white p-5 sm:p-6">
      <h2 className="display flex items-center gap-2 text-xl"><Plus className="size-5 text-brand" aria-hidden /> Adicionar {singular}</h2>
      <Notice error={state.error} success={state.success} stamp={state.stamp} />
      <input type="hidden" name="registry" value={registry} />
      {/* os campos esvaziam depois de salvar e mantêm o digitado quando há erro */}
      <div key={state.stamp ?? 0}><Fields registry={registry} values={{}} state={state} creating /></div>
      <SubmitButton>Adicionar</SubmitButton>
    </form>
  );
}

type RowProps = { registry: RegistryKey; entry: Entry; run: (data: FormData) => void; busy: boolean; canUp: boolean; canDown: boolean };

function Row({ registry, entry, run, busy, canUp, canDown }: RowProps) {
  const [open, setOpen] = useState(false);
  const [state, action, saving] = useActionState(manageRegistry, empty);
  const confirmSubmit = useConfirmSubmit();
  const common = (
    <>
      <input type="hidden" name="registry" value={registry} />
      <input type="hidden" name="key" value={entry.key} />
    </>
  );
  const order = "grid size-9 cursor-pointer place-items-center rounded-sm border border-ink/20 hover:bg-night hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink";
  const button = "cursor-pointer rounded-sm px-4 py-2.5 text-sm font-extrabold transition disabled:opacity-50";
  return (
    <motion.li layout="position" data-entry={entry.title} className="py-1">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 text-left hover:text-brand-deep">
          <motion.span aria-hidden animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="size-5" /></motion.span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <strong className="break-words">{entry.title}</strong>
              {entry.badge && <span className={`px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${entry.group === "ocorrencia" ? "bg-amber-200 text-amber-900" : "bg-leaf/35"}`}>{entry.badge}</span>}
              {entry.active === false && <span className="bg-ink/10 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-ink/60">Desativado</span>}
            </span>
            <span className="block break-words text-sm text-ink/55">{entry.detail}</span>
          </span>
        </button>
        {(canUp || canDown) && (
          <form action={run} className="flex shrink-0 gap-1">
            {common}
            <button name="intent" value="up" disabled={busy || !canUp} aria-label={`Subir ${entry.title}`} className={order}><ArrowUp className="size-4" aria-hidden /></button>
            <button name="intent" value="down" disabled={busy || !canDown} aria-label={`Descer ${entry.title}`} className={order}><ArrowDown className="size-4" aria-hidden /></button>
          </form>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, overflow: "hidden" }} animate={{ height: "auto", transitionEnd: { overflow: "visible" } }} exit={{ height: 0, overflow: "hidden" }}>
            <div className="space-y-3 border-l-4 border-leaf bg-paper p-4">
              <form action={action} className="space-y-3">
                {common}
                <input type="hidden" name="active" value={entry.active === false ? "0" : "1"} />
                <Notice error={state.error} success={state.success} stamp={state.stamp} />
                <div key={`${JSON.stringify(entry.values)}|${state.stamp ?? 0}`}><Fields registry={registry} values={entry.values} state={state} creating={false} /></div>
                <button name="intent" value="save" disabled={saving} className={`${button} bg-brand text-white hover:bg-night`}>Salvar</button>
              </form>
              {entry.fixed ? (
                <p className="text-sm text-ink/60">Etapa do sistema: você pode mudar o nome. Ela não pode ser desativada nem excluída.</p>
              ) : (
                <form action={run} className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
                  {common}
                  <input type="hidden" name="name" value={entry.values.name} />
                  {entry.values.kind && <input type="hidden" name="kind" value={entry.values.kind} />}
                  {entry.active !== undefined && (
                    <>
                      <input type="hidden" name="active" value={entry.active ? "1" : "0"} />
                      <button name="intent" value="toggle" disabled={busy} className={`${button} border border-ink/20 bg-white hover:bg-night hover:text-white`}>{entry.active ? "Desativar" : "Reativar"}</button>
                    </>
                  )}
                  {entry.locked ? (
                    <p className="text-sm text-ink/60">{entry.locked}</p>
                  ) : (
                    <button name="intent" value="delete" disabled={busy} onClick={confirmSubmit({ title: "Excluir este cadastro?", message: `“${entry.title}” sai da lista.${registry === "clientes" || registry === "locais" ? " As cargas já cadastradas não mudam." : ""}`, action: "Excluir" })} className={`${button} flex items-center gap-2 border border-red-300 bg-white text-red-700 hover:bg-red-600 hover:text-white sm:ml-auto`}>
                      <Trash2 className="size-4" aria-hidden /> Excluir
                    </button>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

type Props = { registry: RegistryKey; singular: string; entries: Entry[]; emptyText: string; footer?: string };

export function RegistryManager({ registry, singular, entries, emptyText, footer }: Props) {
  // excluir, reordenar e desativar avisam aqui em cima: o item pode sair do lugar ou da lista
  const [state, run, busy] = useActionState(manageRegistry, empty);
  const neighbor = (index: number, step: number) => {
    const entry = entries[index];
    return (entry.group === "andamento" || entry.group === "ocorrencia") && entries[index + step]?.group === entry.group;
  };
  return (
    <div className="space-y-6">
      <NewEntry registry={registry} singular={singular} />
      <section aria-label="Cadastrados" className="panel bg-white p-5 sm:p-6">
        <Notice error={state.error} success={state.success} stamp={state.stamp} />
        {entries.length === 0 && <p className="text-ink/55">{emptyText}</p>}
        <ul className="divide-y divide-ink/10">
          {entries.map((entry, i) => <Row key={entry.key} registry={registry} entry={entry} run={run} busy={busy} canUp={neighbor(i, -1)} canDown={neighbor(i, 1)} />)}
        </ul>
        {footer && <p className="mt-4 text-sm text-ink/55">{footer}</p>}
      </section>
    </div>
  );
}
