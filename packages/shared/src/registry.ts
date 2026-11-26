/* Cadastros: o que a equipe mantém sem precisar mexer no sistema. */
import type { Role } from "./auth.js";
import type { StageKind } from "./cargo.js";
import type { Paged } from "./paging.js";

export const registries = {
  clientes: { label: "Clientes", singular: "cliente", adminOnly: false, hint: "Aparecem na busca ao cadastrar uma carga. Quem ainda não está aqui entra sozinho na primeira carga." },
  locais: { label: "Locais", singular: "local", adminOnly: false, hint: "Portos, terminais, armazéns e filiais. Aparecem primeiro na busca de origem, destino e andamento." },
  etapas: { label: "Etapas", singular: "etapa", adminOnly: true, hint: "Os passos que o cliente vê no acompanhamento." },
  transportes: { label: "Tipos de transporte", singular: "tipo de transporte", adminOnly: true, hint: "As opções de transporte de uma carga." },
  setores: { label: "Setores", singular: "setor", adminOnly: true, hint: "Os setores das contas dos funcionários." },
} as const;

export type RegistryKey = keyof typeof registries;
export const registryKeys = Object.keys(registries) as RegistryKey[];
export const isRegistry = (key: string): key is RegistryKey => Object.hasOwn(registries, key);

/** Operação cuida do dia a dia; o que muda a estrutura do sistema é só do administrador. */
export const canUseRegistry = (role: Role, key: RegistryKey) => role === "admin" || (role === "operacao" && !registries[key].adminOnly);

export type Customer = { id: number; name: string; document: string; cargos: number };
export type CustomerList = Paged<Customer>;

export type Place = { id: number; name: string; city: string };
export type PlaceList = Paged<Place>;

export type StageItem = { key: string; name: string; kind: StageKind; active: boolean; uses: number };
/** transporte e setor: um nome que pode ser ligado e desligado */
export type NamedItem = { key: string; name: string; active: boolean; uses: number };

/** Uma sugestão da busca enquanto se digita. `detail` explica de onde veio. */
export type Suggestion = { value: string; label: string; detail: string; extra?: string };

/** "São  Gabriel – AM" vira "sao gabriel am": base de toda busca sem acento. */
export const searchText = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
