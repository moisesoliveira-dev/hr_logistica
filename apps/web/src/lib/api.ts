import "server-only";
import { cookies, headers } from "next/headers";
import type { ApiErrorBody } from "@hr/shared";
import { SESSION_COOKIE } from "./auth/shared";

/* Único ponto de contato com a API (NestJS). Roda só no servidor: o navegador nunca fala direto com ela. */

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiErrorBody & { code?: string } };

const ascii = (value: string, max: number) => value.replace(/[^\x20-\x7e]/g, "").slice(0, max);

/** Cabeçalhos que provam que a chamada vem do site e informam quem é o visitante. */
export async function internalHeaders() {
  const incoming = await headers();
  return {
    "x-internal-key": process.env.INTERNAL_API_KEY ?? "",
    "x-client-ip": ascii(incoming.get("x-forwarded-for")?.split(",")[0].trim() || "local", 60),
    "x-client-agent": ascii(incoming.get("user-agent") ?? "", 300),
  };
}

export const apiUrl = (path: string) => new URL(path, process.env.API_URL || "http://localhost:3333");

export async function api<T = undefined>(path: string, options: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const request: Record<string, string> = await internalHeaders();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) request.authorization = `Bearer ${ascii(token, 100)}`;
  if (options.body !== undefined) request["content-type"] = "application/json";
  try {
    const response = await fetch(apiUrl(path), {
      method: options.method ?? "GET",
      headers: request,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const data = response.status === 204 ? undefined : await response.json();
    return response.ok
      ? { ok: true, status: response.status, data: data as T }
      : { ok: false, status: response.status, error: data as ApiErrorBody };
  } catch (error) {
    console.error("API indisponível:", error instanceof Error ? error.message : error);
    return { ok: false, status: 503, error: { message: "O serviço está indisponível no momento. Tente novamente em instantes." } };
  }
}
