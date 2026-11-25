"use server";
/* As regras ficam na API; aqui só repassamos os dados e cuidamos do cookie. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { NewSession } from "@hr/shared";
import { api, type ApiResult } from "../api";
import { clearSessionCookie, setSessionCookie } from "./session";
import { safeNext, type FormState } from "./shared";

const read = (data: FormData, key: string) => String(data.get(key) ?? "").slice(0, 300);

const failure = <T>(result: Extract<ApiResult<T>, { ok: false }>, extra: Partial<FormState> = {}): FormState =>
  ({ error: result.error.message, fields: result.error.fields, stamp: Date.now(), ...extra });

export async function login(_: FormState, data: FormData): Promise<FormState> {
  const email = read(data, "email").trim().toLowerCase();
  const remember = data.get("remember") === "on";
  const result = await api<NewSession>("/auth/login", { method: "POST", body: { email, password: String(data.get("password") ?? "").slice(0, 128), remember } });
  if (!result.ok) return failure(result, { values: { email, remember: remember ? "on" : "" } });
  await setSessionCookie(result.data);
  redirect(result.data.mustChangePassword ? "/portal/trocar-senha" : safeNext(read(data, "next")));
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
  await clearSessionCookie();
  redirect("/login?aviso=saiu");
}

export async function requestPasswordReset(_: FormState, data: FormData): Promise<FormState> {
  const email = read(data, "email").trim();
  const result = await api("/auth/password/forgot", { method: "POST", body: { email } });
  if (!result.ok) return failure(result, { values: { email } });
  return { success: "Se houver uma conta ativa com esse e-mail, enviaremos um link para criar uma nova senha. Ele vale por 30 minutos.", stamp: Date.now() };
}

export async function resetPassword(_: FormState, data: FormData): Promise<FormState> {
  const result = await api("/auth/password/reset", { method: "POST", body: { token: read(data, "token"), password: read(data, "password"), confirm: read(data, "confirm") } });
  if (!result.ok) return failure(result);
  redirect("/login?aviso=senha");
}

export async function changePassword(_: FormState, data: FormData): Promise<FormState> {
  const firstAccess = !data.has("current");
  const result = await api<NewSession>("/auth/password/change", {
    method: "POST",
    body: { current: read(data, "current").slice(0, 128), password: read(data, "password"), confirm: read(data, "confirm") },
  });
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return failure(result);
  }
  await setSessionCookie(result.data);
  if (firstAccess) redirect("/portal");
  return { success: "Senha alterada. Os outros aparelhos foram desconectados.", stamp: Date.now() };
}

export async function revokeSession(data: FormData) {
  const target = read(data, "sessionId");
  const path = target === "outras" ? "/auth/sessions" : `/auth/sessions/${encodeURIComponent(target)}`;
  const result = await api(path, { method: "DELETE" });
  if (!result.ok && result.status === 401) redirect("/login");
  revalidatePath("/portal/perfil");
}
