"use server";
/* Consulta pública de carga: o CNPJ/CPF vai no corpo do pedido, nunca no endereço. */
import type { PublicCargo } from "@hr/shared";
import { api } from "./api";

export type TrackingState = { cargo?: PublicCargo; error?: string; code?: string; document?: string; stamp?: number };

export async function trackCargo(_: TrackingState, data: FormData): Promise<TrackingState> {
  const code = String(data.get("code") ?? "").slice(0, 30).trim();
  const document = String(data.get("document") ?? "").slice(0, 30).trim();
  if (!code || !document) return { error: "Informe o código da carga e o CNPJ ou CPF.", code, document, stamp: Date.now() };
  const result = await api<PublicCargo>("/public/tracking", { method: "POST", body: { code, document } });
  if (!result.ok) return { error: result.error.message, code, document, stamp: Date.now() };
  return { cargo: result.data, code, document, stamp: Date.now() };
}
