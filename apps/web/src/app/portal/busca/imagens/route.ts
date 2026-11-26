import { api } from "@/lib/api";

/** Acervo para o seletor de imagens: busca e página. Quem pode consultar é conferido pela API. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { q?: unknown; page?: unknown } | null;
  const params = new URLSearchParams({ q: String(body?.q ?? "").slice(0, 100), page: String(body?.page ?? 1).slice(0, 10) });
  const result = await api(`/content/media?${params}`);
  return Response.json(result.ok ? result.data : null, { status: result.status, headers: { "cache-control": "no-store" } });
}
