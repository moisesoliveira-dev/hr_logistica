"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Copy, KeyRound, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { createEmployee, manageEmployee } from "@/lib/auth/admin-actions";
import { roleLabels, roles, type Employee, type NamedItem } from "@hr/shared";
import type { FormState } from "@/lib/auth/shared";
import { Notice, SubmitButton, TextField } from "../auth/fields";
import { useConfirmSubmit } from "../confirm";

type Row = Employee & { lastLogin: string };

const empty: FormState = {};

/** A senha provisória aparece só aqui, uma única vez: o servidor guarda apenas o hash. */
function Credential({ credential }: { credential: NonNullable<FormState["credential"]> }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div className="rounded-sm border-2 border-dashed border-brand bg-leaf/15 p-4" initial={{ scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 13 }}>
      <p className="flex items-center gap-2 font-extrabold"><KeyRound className="size-5 text-brand" aria-hidden /> Senha provisória de {credential.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code data-testid="senha-provisoria" translate="no" className="notranslate select-all rounded-sm bg-night px-4 py-2 text-lg font-bold tracking-wider text-leaf">{credential.password}</code>
        <button type="button" onClick={() => navigator.clipboard.writeText(credential.password).then(() => setCopied(true), () => setCopied(false))} className="flex cursor-pointer items-center gap-2 rounded-sm bg-white px-4 py-2 text-sm font-extrabold shadow">
          {copied ? <Check className="size-4 text-brand" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? "Copiada" : "Copiar"}
        </button>
      </div>
      <p className="mt-3 text-sm text-ink/65">Entregue por um canal seguro. Ela não será mostrada de novo, vale por 72 horas e precisa ser trocada no primeiro acesso.</p>
    </motion.div>
  );
}

function SelectField({ label, name, defaultValue, options, error }: { label: string; name: string; defaultValue: string; options: [string, string][]; error?: string }) {
  return (
    <div>
      <label className="relative block">
        <select name={name} defaultValue={defaultValue} required className={`field peer cursor-pointer ${error ? "!border-red-500" : ""}`}>
          <option value="" disabled>Selecione</option>
          {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
        <span className="field-label">{label}</span>
      </label>
      {error && <p className="pl-2 pt-1.5 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

/** Setores ativos e, na edição, o setor atual da conta, mesmo que tenha sido desativado. */
const sectorOptions = (sectors: NamedItem[], current?: string) => sectors.filter((s) => s.active || s.name === current).map((s) => [s.name, s.name] as [string, string]);
const roleOptions: [string, string][] = roles.map((r) => [r, roleLabels[r]]);

function NewEmployee({ sectors }: { sectors: NamedItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createEmployee, empty);
  return (
    <div className="panel bg-white p-5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-3 text-left text-lg font-extrabold">
        <span className="grid size-11 place-items-center rounded-sm bg-brand text-white"><UserPlus className="size-5" aria-hidden /></span>
        <span className="flex-1">Novo funcionário</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown aria-hidden /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="overflow-hidden" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
            <form action={action} className="space-y-4 px-1 pb-1 pt-5">
              <Notice error={state.error} success={state.success} stamp={state.stamp} />
              {state.credential && <Credential key={state.credential.password} credential={state.credential} />}
              <div key={state.stamp ?? 0} className="grid gap-4 sm:grid-cols-2">
                <TextField label="Nome completo" name="name" required maxLength={100} autoComplete="off" defaultValue={state.values?.name} error={state.fields?.name} />
                <TextField label="E-mail corporativo" name="email" type="email" required autoComplete="off" defaultValue={state.values?.email} error={state.fields?.email} />
                <SelectField label="Setor" name="department" defaultValue={state.values?.department ?? ""} options={sectorOptions(sectors)} error={state.fields?.department} />
                <SelectField label="Perfil de acesso" name="role" defaultValue={state.values?.role ?? "colaborador"} options={roleOptions} />
              </div>
              <SubmitButton>Criar conta</SubmitButton>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: string }) {
  return <span className={`rounded-sm px-2.5 py-0.5 text-xs font-extrabold ${tone}`}>{children}</span>;
}

function EmployeeRow({ employee, self, sectors }: { employee: Row; self: boolean; sectors: NamedItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(manageEmployee, empty);
  const confirmSubmit = useConfirmSubmit();
  const button = "cursor-pointer rounded-sm px-4 py-2.5 text-sm font-extrabold transition disabled:opacity-50";
  return (
    <motion.li layout="position" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} className="panel bg-white">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} disabled={self} className="flex w-full cursor-pointer items-center gap-4 p-4 text-left disabled:cursor-default">
        <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-sm font-extrabold text-white ${employee.active ? "bg-brand" : "bg-ink/30"}`}>
          {employee.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong>{employee.name}</strong>
            {self && <Badge tone="bg-leaf/40">Você</Badge>}
            {employee.role === "admin" && <Badge tone="bg-night text-white">Admin</Badge>}
            {employee.role === "marketing" && <Badge tone="bg-leaf text-night">Marketing</Badge>}
            {employee.role === "operacao" && <Badge tone="bg-brand-deep text-white">Operação</Badge>}
            {!employee.active && <Badge tone="bg-ink/10 text-ink/60">Desativado</Badge>}
            {employee.active && employee.pending && <Badge tone={employee.expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}>{employee.expired ? "Provisória expirada" : "Aguardando 1º acesso"}</Badge>}
            {employee.locked && <Badge tone="bg-red-100 text-red-700">Login bloqueado</Badge>}
          </span>
          <span className="block truncate text-sm text-ink/55">{employee.email} · {employee.department} · último acesso: {employee.lastLogin}</span>
        </span>
        {!self && <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown aria-hidden /></motion.span>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="overflow-hidden" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
            <form action={action} className="space-y-4 border-t border-ink/10 p-5">
              <input type="hidden" name="userId" value={employee.id} />
              <Notice error={state.error} success={state.success} stamp={state.stamp} />
              {state.credential && <Credential key={state.credential.password} credential={state.credential} />}
              <div key={`${employee.name}|${employee.department}|${employee.role}|${state.stamp ?? 0}`} className="grid gap-4 sm:grid-cols-3">
                <TextField label="Nome completo" name="name" required maxLength={100} defaultValue={employee.name} error={state.fields?.name} />
                <SelectField label="Setor" name="department" defaultValue={employee.department} options={sectorOptions(sectors, employee.department)} error={state.fields?.department} />
                <SelectField label="Perfil de acesso" name="role" defaultValue={employee.role} options={roleOptions} />
              </div>
              <div className="flex flex-wrap gap-2">
                {/* o primeiro botão é o acionado pela tecla Enter */}
                <button name="intent" value="save" disabled={pending} className={`${button} bg-brand text-white hover:bg-night`}>Salvar</button>
                <button name="intent" value="password" disabled={pending} onClick={confirmSubmit({ title: "Gerar senha provisória?", message: `${employee.name} receberá uma nova senha e as sessões atuais serão encerradas.`, action: "Gerar senha" })} className={`${button} border border-ink/20 hover:bg-night hover:text-white`}>Gerar senha provisória</button>
                {employee.locked && <button name="intent" value="unlock" disabled={pending} className={`${button} border border-amber-400 hover:bg-amber-100`}>Desbloquear login</button>}
                <button name="intent" value={employee.active ? "deactivate" : "activate"} disabled={pending} onClick={employee.active ? confirmSubmit({ title: "Desativar esta conta?", message: `${employee.name} perde o acesso na hora.`, action: "Desativar conta" }) : undefined} className={`${button} sm:ml-auto ${employee.active ? "border border-red-300 text-red-700 hover:bg-red-600 hover:text-white" : "bg-leaf hover:bg-night hover:text-white"}`}>
                  {employee.active ? "Desativar conta" : "Reativar conta"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function UserAdmin({ employees, selfId, sectors, filters }: { employees: Row[]; selfId: number; sectors: NamedItem[]; filters: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <NewEmployee sectors={sectors} />
      {filters}
      <ul className="space-y-3">
        {employees.map((e) => <EmployeeRow key={e.id} employee={e} self={e.id === selfId} sectors={sectors} />)}
      </ul>
      {!employees.length && <p className="text-center text-ink/55">Nenhum funcionário encontrado.</p>}
    </div>
  );
}
