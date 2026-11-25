"use server";
/* Marketing e administrador. A API confere o perfil em todas as operações. */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSiteSection, type PostItem } from "@hr/shared";
import { api, apiUrl, internalHeaders, type ApiResult } from "../api";
import { SESSION_COOKIE, type FormState } from "./shared";

function failure<T>(result: Extract<ApiResult<T>, { ok: false }>, extra: Partial<FormState> = {}): FormState {
  if (result.status === 401) redirect("/login");
  if (result.status === 403) redirect("/portal");
  return { error: result.error.message, fields: result.error.fields, stamp: Date.now(), ...extra };
}

const refresh = () => {
  revalidatePath("/portal/conteudo", "layout");
  revalidatePath("/hr-news");
};

export async function uploadImage(_: FormState, data: FormData): Promise<FormState> {
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Escolha uma imagem.", stamp: Date.now() };
  if (file.size > 8 * 1024 * 1024) return { error: "A imagem deve ter no máximo 8 MB.", stamp: Date.now() };
  const body = new FormData();
  body.set("file", file);
  body.set("alt", String(data.get("alt") ?? "").slice(0, 300));
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  const response = await fetch(apiUrl("/content/media"), {
    method: "POST",
    headers: { ...(await internalHeaders()), authorization: `Bearer ${token.replace(/[^\w-]/g, "")}` },
    body,
    cache: "no-store",
  }).catch(() => null);
  if (!response) return { error: "Não foi possível enviar agora. Tente novamente.", stamp: Date.now() };
  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/portal");
  if (!response.ok) {
    const result = await response.json().catch(() => ({ message: "Não foi possível enviar a imagem." }));
    return { error: result.message, stamp: Date.now() };
  }
  refresh();
  return { success: "Imagem enviada.", stamp: Date.now() };
}

export async function manageImage(_: FormState, data: FormData): Promise<FormState> {
  const id = String(data.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Imagem não encontrada.", stamp: Date.now() };
  const result = data.get("intent") === "delete"
    ? await api(`/content/media/${id}`, { method: "DELETE" })
    : await api(`/content/media/${id}`, { method: "PATCH", body: { alt: String(data.get("alt") ?? "").slice(0, 300) } });
  if (!result.ok) return failure(result);
  refresh();
  return { success: data.get("intent") === "delete" ? "Imagem removida." : "Descrição salva.", stamp: Date.now() };
}

export async function savePost(_: FormState, data: FormData): Promise<FormState> {
  const id = Number(data.get("id") || 0);
  const body = {
    title: String(data.get("title") ?? "").slice(0, 300),
    excerpt: String(data.get("excerpt") ?? "").slice(0, 600),
    body: String(data.get("body") ?? "").slice(0, 60_000),
    coverId: String(data.get("coverId") ?? "") || null,
    status: data.get("intent") === "publicar" ? "publicado" : "rascunho",
  };
  if (id && !Number.isSafeInteger(id)) return { error: "Notícia não encontrada.", stamp: Date.now() };
  const result = await api<PostItem>(id ? `/content/posts/${id}` : "/content/posts", { method: id ? "PATCH" : "POST", body });
  if (!result.ok) return failure(result, { values: { title: body.title, excerpt: body.excerpt, body: body.body, coverId: body.coverId ?? "" } });
  refresh();
  revalidatePath(`/noticias/${result.data.slug}`);
  if (!id) redirect(`/portal/conteudo/noticias/${result.data.id}?salvo=1`);
  return { success: body.status === "publicado" ? "Publicada no site." : "Rascunho salvo (não aparece no site).", stamp: Date.now() };
}

export async function deletePost(data: FormData) {
  const id = Number(data.get("id"));
  if (Number.isSafeInteger(id) && id > 0) {
    const result = await api(`/content/posts/${id}`, { method: "DELETE" });
    if (!result.ok && result.status === 401) redirect("/login");
  }
  refresh();
  redirect("/portal/conteudo/noticias");
}

/* ───────── partes do site ───────── */

const missing = (): FormState => ({ error: "Item não encontrado.", stamp: Date.now() });

export async function saveSiteItem(_: FormState, data: FormData): Promise<FormState> {
  const id = Number(data.get("id") || 0);
  const section = String(data.get("section") ?? "");
  if (!Number.isSafeInteger(id) || !isSiteSection(section)) return missing();
  const text = (name: string, max: number) => String(data.get(name) ?? "").slice(0, max);
  const body = {
    title: text("title", 300),
    subtitle: text("subtitle", 300),
    text: text("text", 2000),
    mediaId: String(data.get("mediaId") ?? "") || null,
    removeImage: data.get("removeImage") === "1",
    visible: data.get("visible") === "on",
  };
  const result = await api(id ? `/content/site/items/${id}` : `/content/site/${section}`, { method: id ? "PATCH" : "POST", body });
  if (!result.ok) return failure(result, { values: { title: body.title, subtitle: body.subtitle, text: body.text, mediaId: body.mediaId ?? "", visible: body.visible ? "on" : "" } });
  refresh();
  return { success: !body.visible ? "Salvo (oculto no site)." : id ? "Alterações no ar." : "Adicionado ao site.", stamp: Date.now() };
}

export async function manageSiteItem(_: FormState, data: FormData): Promise<FormState> {
  const id = Number(data.get("id"));
  const intent = String(data.get("intent"));
  if (!Number.isSafeInteger(id) || id <= 0) return missing();
  const result = intent === "delete"
    ? await api(`/content/site/items/${id}`, { method: "DELETE" })
    : await api(`/content/site/items/${id}/move`, { method: "POST", body: { direction: intent === "up" ? "up" : "down" } });
  if (!result.ok) return failure(result);
  refresh();
  return { stamp: Date.now() };
}

/* ───────── contatos e redes ───────── */

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  let data: unknown;
  try {
    data = JSON.parse(String(form.get("data") ?? "").slice(0, 60_000));
  } catch {
    return { error: "Não foi possível ler os dados. Recarregue a página.", stamp: Date.now() };
  }
  const result = await api("/content/settings", { method: "PUT", body: { data, version: String(form.get("version") ?? "") || null } });
  if (!result.ok) return failure(result);
  refresh();
  return { success: "Salvo. O site já mostra os novos dados.", stamp: Date.now() };
}
