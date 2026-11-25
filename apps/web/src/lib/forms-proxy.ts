import "server-only";
import { MAX_FILE_BYTES, type FormKind } from "@hr/shared";
import { apiUrl, internalHeaders } from "./api";

const fail = (error: string, status: number, errors?: Record<string, string>) => Response.json({ ok: false, error, errors }, { status });

/** Repassa o formulário público (com anexo) para a API. */
export async function forwardForm(kind: FormKind, request: Request) {
  const length = Number(request.headers.get("content-length"));
  if (!length || length > MAX_FILE_BYTES + 100_000) return fail("Envio grande demais (anexo de até 5 MB).", 413);
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data")) return fail("Requisição inválida.", 400);
  try {
    const response = await fetch(apiUrl(`/forms/${kind}`), {
      method: "POST",
      headers: { ...(await internalHeaders()), "content-type": type },
      body: await request.arrayBuffer(),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    const data = await response.json();
    return response.ok ? Response.json(data) : fail(data.message, response.status, data.fields);
  } catch (error) {
    console.error("Falha ao repassar formulário:", error instanceof Error ? error.message : error);
    return fail("Não foi possível enviar agora. Tente novamente ou use o WhatsApp.", 503);
  }
}
