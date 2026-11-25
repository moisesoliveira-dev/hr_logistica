"use server";
/* A API exige administrador em todas estas operações. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Credential } from "@hr/shared";
import { api, type ApiResult } from "../api";
import type { FormState } from "./shared";

const done = (success: string, extra: Partial<FormState> = {}): FormState => {
  revalidatePath("/portal/usuarios");
  return { success, stamp: Date.now(), ...extra };
};

function failure<T>(result: Extract<ApiResult<T>, { ok: false }>, extra: Partial<FormState> = {}): FormState {
  if (result.status === 401) redirect("/login");
  if (result.status === 403) redirect("/portal");
  return { error: result.error.message, fields: result.error.fields, stamp: Date.now(), ...extra };
}

const profile = (data: FormData) => ({
  name: String(data.get("name") ?? "").slice(0, 300),
  department: String(data.get("department") ?? "").slice(0, 100),
  role: String(data.get("role") ?? "").slice(0, 30),
});

export async function createEmployee(_: FormState, data: FormData): Promise<FormState> {
  const body = { ...profile(data), email: String(data.get("email") ?? "").slice(0, 300).trim() };
  const result = await api<Credential>("/users", { method: "POST", body });
  if (!result.ok) return failure(result, { values: body });
  return done("Conta criada.", { credential: result.data });
}

export async function manageEmployee(_: FormState, data: FormData): Promise<FormState> {
  // só aceita número inteiro, para o valor nunca alterar o caminho chamado na API
  const id = Number(data.get("userId"));
  if (!Number.isSafeInteger(id) || id <= 0) return { error: "Usuário não encontrado.", stamp: Date.now() };

  const finish = <T>(result: ApiResult<T>, message: string) => (result.ok ? done(message) : failure(result));
  switch (String(data.get("intent"))) {
    case "save":
      return finish(await api(`/users/${id}`, { method: "PATCH", body: profile(data) }), "Dados salvos.");
    case "activate":
      return finish(await api(`/users/${id}/status`, { method: "POST", body: { active: true } }), "Conta reativada.");
    case "deactivate":
      return finish(await api(`/users/${id}/status`, { method: "POST", body: { active: false } }), "Conta desativada e sessões encerradas.");
    case "unlock":
      return finish(await api(`/users/${id}/unlock`, { method: "POST" }), "Tentativas de login liberadas.");
    case "password": {
      const result = await api<Credential>(`/users/${id}/temporary-password`, { method: "POST" });
      return result.ok ? done("Nova senha provisória gerada.", { credential: result.data }) : failure(result);
    }
    default:
      return { error: "Ação desconhecida.", stamp: Date.now() };
  }
}
