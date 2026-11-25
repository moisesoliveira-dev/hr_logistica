import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { canEditContent, canManageCargo, type NewSession, type SessionInfo } from "@hr/shared";
import { api } from "../api";
import { SESSION_COOKIE } from "./shared";

export async function setSessionCookie(session: NewSession) {
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // sem maxAge o cookie some quando o navegador é fechado
    ...(session.remember ? { maxAge: session.maxAgeSeconds } : {}),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Pergunta à API se a sessão vale (uma vez por requisição). `null` = não está logado. */
export const getSession = cache(async (): Promise<SessionInfo | null> => {
  if (!(await cookies()).has(SESSION_COOKIE)) return null;
  const result = await api<SessionInfo>("/auth/session");
  if (result.ok) return result.data;
  if (result.status === 401) return null;
  // API fora do ar não pode ser tratada como "deslogado"
  throw new Error(result.error.message);
});

/**
 * Chame em toda página do portal (o proxy faz apenas um redirecionamento preliminar).
 * A autorização de verdade é imposta pela API, em cada rota.
 */
export async function requireUser({ allowPendingPassword = false } = {}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword && !allowPendingPassword) redirect("/portal/trocar-senha");
  return session;
}

export async function requireContentEditor() {
  const session = await requireUser();
  if (!canEditContent(session.user.role)) redirect("/portal");
  return session;
}

export async function requireCargoManager() {
  const session = await requireUser();
  if (!canManageCargo(session.user.role)) redirect("/portal");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/portal");
  return session;
}

/** Para leituras dentro do portal: trata sessão expirada e falta de permissão. */
export async function apiData<T>(path: string): Promise<T> {
  const result = await api<T>(path);
  if (result.ok) return result.data;
  if (result.status === 401) redirect("/login");
  if (result.status === 403) redirect("/portal");
  throw new Error(result.error.message);
}
