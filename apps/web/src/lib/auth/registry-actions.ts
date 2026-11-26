"use server";
/* A API confere o perfil em cada cadastro: Operação cuida de clientes e locais; o resto é do administrador. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRegistry, type RegistryKey } from "@hr/shared";
import { api, type ApiResult } from "../api";
import type { FormState } from "./shared";

const text = (data: FormData, name: string) => String(data.get(name) ?? "").slice(0, 200);

const bodies: Record<RegistryKey, (data: FormData, active: boolean) => Record<string, unknown>> = {
  clientes: (d) => ({ name: text(d, "name"), document: text(d, "document").slice(0, 30) }),
  locais: (d) => ({ name: text(d, "name"), city: text(d, "city").slice(0, 100) }),
  etapas: (d, active) => ({ name: text(d, "name"), kind: text(d, "kind").slice(0, 20), active }),
  transportes: (d, active) => ({ name: text(d, "name"), active }),
  setores: (d, active) => ({ name: text(d, "name"), active }),
};

function failure<T>(result: Extract<ApiResult<T>, { ok: false }>, values?: Record<string, string>): FormState {
  if (result.status === 401) redirect("/login");
  if (result.status === 403) redirect("/portal");
  return { error: result.error.message, fields: result.error.fields, values, stamp: Date.now() };
}

export async function manageRegistry(_: FormState, data: FormData): Promise<FormState> {
  const registry = text(data, "registry");
  const key = text(data, "key");
  const intent = text(data, "intent");
  // a chave entra no caminho chamado na API: só letras, números e sublinhado
  if (!isRegistry(registry) || (key && !/^[a-z0-9_]{1,40}$/.test(key))) return { error: "Cadastro não encontrado.", stamp: Date.now() };
  const base = `/registry/${registry}`;

  let result: ApiResult<unknown>;
  let message: string;
  let values: Record<string, string> | undefined;
  if (intent === "delete" && key) {
    result = await api(`${base}/${key}`, { method: "DELETE" });
    message = "Cadastro excluído.";
  } else if ((intent === "up" || intent === "down") && key) {
    result = await api(`${base}/${key}/move`, { method: "POST", body: { direction: intent } });
    message = "Ordem atualizada.";
  } else {
    const current = data.get("active") !== "0";
    const active = intent === "toggle" ? !current : current;
    const body = bodies[registry](data, active);
    values = Object.fromEntries(Object.entries(body).map(([name, value]) => [name, String(value)]));
    result = await api(key ? `${base}/${key}` : base, { method: key ? "PATCH" : "POST", body });
    message = intent === "toggle" ? (active ? "Cadastro reativado." : "Cadastro desativado.") : key ? "Alterações salvas." : "Cadastro criado.";
  }
  if (!result.ok) return failure(result, values);
  // as listas aparecem em outras telas do portal
  revalidatePath("/portal", "layout");
  return { success: message, stamp: Date.now() };
}
