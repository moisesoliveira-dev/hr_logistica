import type { Metadata } from "next";
import { Search } from "lucide-react";
import { roleLabels, roles, type Employee, type NamedItem, type Paged } from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { PageTitle } from "@/components/portal/ui";
import { UserAdmin } from "@/components/portal/users";
import { apiData, requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Usuários" };

type Props = { searchParams: Promise<{ q?: string | string[]; perfil?: string | string[]; situacao?: string | string[]; pagina?: string | string[] }> };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.slice(0, 100) : "");
const control = "rounded-sm border border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand";
const statuses = [["ativas", "Ativas"], ["desativadas", "Desativadas"], ["pendentes", "Aguardando 1º acesso"], ["bloqueadas", "Login bloqueado"]];

export default async function UsersPage({ searchParams }: Props) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const q = one(params.q);
  const role = one(params.perfil);
  const status = one(params.situacao);
  const [{ items, total, page, pageSize }, sectors] = await Promise.all([
    apiData<Paged<Employee>>(`/users?${new URLSearchParams({ q, role, status, page: one(params.pagina) })}`),
    apiData<NamedItem[]>("/registry/setores"),
  ]);
  const filters = (
    <form method="get" className="flex flex-wrap gap-3">
      <input name="q" type="search" defaultValue={q} placeholder="Nome, e-mail ou setor" aria-label="Buscar funcionário" className={`${control} min-w-60 flex-1`} />
      <select key={`perfil-${role}`} name="perfil" defaultValue={role} aria-label="Filtrar por perfil" className={`${control} cursor-pointer`}>
        <option value="">Todos os perfis</option>
        {roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
      </select>
      <select key={`situacao-${status}`} name="situacao" defaultValue={status} aria-label="Filtrar por situação" className={`${control} cursor-pointer`}>
        <option value="">Todas as contas</option>
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
    </form>
  );
  return (
    <>
      <PageTitle eyebrow="Administração" title="Usuários" />
      <UserAdmin filters={filters} employees={items.map((e) => ({ ...e, lastLogin: e.lastLoginAt ? formatDate(e.lastLoginAt) : "nunca" }))} selfId={user.id} sectors={sectors} />
      <Pagination page={page} pageSize={pageSize} total={total} unit={["conta", "contas"]} path="/portal/usuarios" params={{ q, perfil: role, situacao: status }} />
    </>
  );
}
