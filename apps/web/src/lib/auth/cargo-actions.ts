"use server";
/* Operação e administrador. A API confere o perfil em todas as operações. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CargoSummary } from "@hr/shared";
import { api, type ApiResult } from "../api";
import type { FormState } from "./shared";

const text = (data: FormData, name: string, max: number) => String(data.get(name) ?? "").slice(0, max);
const toId = (value: FormDataEntryValue | null) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
};
const missing = (): FormState => ({ error: "Carga não encontrada.", stamp: Date.now() });

function failure<T>(result: Extract<ApiResult<T>, { ok: false }>, values?: Record<string, string>): FormState {
  if (result.status === 401) redirect("/login");
  if (result.status === 403) redirect("/portal");
  return { error: result.error.message, fields: result.error.fields, values, stamp: Date.now() };
}

const refresh = () => revalidatePath("/portal/cargas", "layout");

export async function saveCargo(_: FormState, data: FormData): Promise<FormState> {
  const id = data.get("id") ? toId(data.get("id")) : 0;
  if (data.get("id") && !id) return missing();
  const body = {
    invoice: text(data, "invoice", 100),
    customerName: text(data, "customerName", 200),
    customerDocument: text(data, "customerDocument", 30),
    origin: text(data, "origin", 200),
    destination: text(data, "destination", 200),
    mode: text(data, "mode", 20),
    expectedAt: text(data, "expectedAt", 10),
  };
  const result = await api<CargoSummary | undefined>(id ? `/cargo/${id}` : "/cargo", { method: id ? "PATCH" : "POST", body });
  if (!result.ok) return failure(result, body);
  refresh();
  if (!id) redirect(`/portal/cargas/${result.data!.id}?nova=1`);
  return { success: "Dados da carga salvos.", stamp: Date.now() };
}

export async function addCargoEvent(_: FormState, data: FormData): Promise<FormState> {
  const id = toId(data.get("id"));
  if (!id) return missing();
  const body = { stage: text(data, "stage", 30), location: text(data, "location", 200), note: text(data, "note", 600), at: text(data, "at", 16) };
  const result = await api(`/cargo/${id}/events`, { method: "POST", body });
  if (!result.ok) return failure(result, body);
  refresh();
  return { success: "Andamento registrado. O cliente já vê a atualização.", stamp: Date.now() };
}

export async function removeCargoEvent(_: FormState, data: FormData): Promise<FormState> {
  const id = toId(data.get("id"));
  const eventId = toId(data.get("eventId"));
  if (!id || !eventId) return missing();
  const result = await api(`/cargo/${id}/events/${eventId}`, { method: "DELETE" });
  if (!result.ok) return failure(result);
  refresh();
  return { success: "Etapa removida do histórico.", stamp: Date.now() };
}

export async function deleteCargo(data: FormData) {
  const id = toId(data.get("id"));
  if (id) {
    const result = await api(`/cargo/${id}`, { method: "DELETE" });
    if (!result.ok && result.status === 401) redirect("/login");
    if (!result.ok && result.status === 403) redirect("/portal");
  }
  refresh();
  redirect("/portal/cargas");
}
