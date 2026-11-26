import type { Metadata } from "next";
import { Search } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  canUseRegistry, formatDocument, isRegistry, registries, registryKeys, stageKindLabels,
  type CustomerList, type NamedItem, type PlaceList, type RegistryKey, type StageItem,
} from "@hr/shared";
import { Pagination } from "@/components/pagination";
import { RegistryManager, type Entry } from "@/components/portal/registry";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireCargoManager } from "@/lib/auth/session";

type Props = { params: Promise<{ tipo: string }>; searchParams: Promise<{ q?: string | string[]; pagina?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo } = await params;
  return { title: isRegistry(tipo) ? registries[tipo].label : "Cadastros" };
}

const plural = (n: number, one: string, many: string) => (n === 0 ? `sem ${many}` : `${n} ${n === 1 ? one : many}`);

const named = (items: NamedItem[], one: string, many: string, locked: string): Entry[] =>
  items.map((i) => ({ key: i.key, title: i.name, detail: plural(i.uses, one, many), values: { name: i.name }, active: i.active, locked: i.uses ? locked : undefined }));

type Loaded = { entries: Entry[]; paging?: { page: number; pageSize: number; total: number } };

/** Busca o cadastro na API e converte para o formato da tela. */
async function load(type: RegistryKey, q: string, page: string): Promise<Loaded> {
  const query = `?${new URLSearchParams({ q, page })}`;
  switch (type) {
    case "clientes": {
      const { items, ...paging } = await apiData<CustomerList>(`/registry/clientes${query}`);
      return {
        paging,
        entries: items.map((c) => ({ key: String(c.id), title: c.name, detail: `${formatDocument(c.document)} · ${plural(c.cargos, "carga", "cargas")}`, values: { name: c.name, document: formatDocument(c.document) } })),
      };
    }
    case "locais": {
      const { items, ...paging } = await apiData<PlaceList>(`/registry/locais${query}`);
      return { paging, entries: items.map((p) => ({ key: String(p.id), title: p.name, detail: p.city, values: { name: p.name, city: p.city } })) };
    }
    case "etapas": {
      const items = await apiData<StageItem[]>("/registry/etapas");
      return {
        entries: items.map((s) => {
          const fixed = s.kind === "inicio" || s.kind === "entrega";
          return {
            key: s.key, title: s.name, detail: plural(s.uses, "carga no histórico", "cargas no histórico"), values: { name: s.name, kind: s.kind },
            active: s.active, badge: stageKindLabels[s.kind], group: s.kind, fixed,
            locked: s.uses ? "Já está no histórico de cargas: dá para desativar, não excluir." : undefined,
          };
        }),
      };
    }
    case "transportes":
      return { entries: named(await apiData<NamedItem[]>("/registry/transportes"), "carga", "cargas", "Há cargas com este transporte: dá para desativar, não excluir.") };
    case "setores":
      return { entries: named(await apiData<NamedItem[]>("/registry/setores"), "conta", "contas", "Há contas neste setor: dá para desativar, não excluir.") };
  }
}

export default async function RegistryPage({ params, searchParams }: Props) {
  const { user } = await requireCargoManager();
  const [{ tipo }, search] = await Promise.all([params, searchParams]);
  if (!isRegistry(tipo)) notFound();
  if (!canUseRegistry(user.role, tipo)) redirect("/portal/cadastros/clientes");

  const { label, singular, hint } = registries[tipo];
  // só clientes e locais crescem sem limite: são os que têm busca
  const searchable = tipo === "clientes" || tipo === "locais";
  const q = searchable && typeof search.q === "string" ? search.q.slice(0, 100) : "";
  const { entries, paging } = await load(tipo, q, typeof search.pagina === "string" ? search.pagina.slice(0, 10) : "");

  const emptyText = q ? "Nada encontrado com essa busca." : tipo === "locais" ? "Nenhum local cadastrado ainda. As cidades do IBGE já aparecem na busca das cargas." : "Nada cadastrado ainda.";
  const footer = tipo === "etapas" ? "As setas definem a ordem do caminho. Mudar o nome de uma etapa muda também o histórico das cargas." : undefined;

  return (
    <>
      <PageTitle eyebrow="Cadastros" title={label} />
      <nav aria-label="Tipos de cadastro" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {registryKeys.filter((key) => canUseRegistry(user.role, key)).map((key) => (
            <li key={key}>
              <Link href={`/portal/cadastros/${key}`} aria-current={key === tipo ? "page" : undefined} className={`block border px-4 py-2.5 text-sm font-extrabold transition-colors ${key === tipo ? "border-night bg-night text-white" : "border-ink/15 bg-white hover:border-brand hover:text-brand-deep"}`}>
                {registries[key].label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mb-6 max-w-2xl text-ink/65">{hint}</p>
      {searchable && (
        <form key={tipo} method="get" className="mb-6 flex flex-wrap gap-3">
          <input name="q" type="search" defaultValue={q} placeholder={tipo === "clientes" ? "Nome, CNPJ ou CPF" : "Nome do local ou cidade"} aria-label={`Buscar ${singular}`} className="min-w-60 flex-1 rounded-sm border border-ink/15 bg-white px-5 py-3 outline-none focus:border-brand" />
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-night px-6 py-3 font-extrabold text-white hover:bg-brand"><Search className="size-4" aria-hidden /> Buscar</button>
        </form>
      )}
      <RegistryManager key={tipo} registry={tipo} singular={singular} entries={entries} emptyText={emptyText} footer={footer} />
      {paging && <Pagination {...paging} unit={[singular, registries[tipo].label.toLowerCase()]} path={`/portal/cadastros/${tipo}`} params={{ q }} />}
    </>
  );
}
