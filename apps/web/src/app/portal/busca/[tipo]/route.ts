import type { Suggestion } from "@hr/shared";
import { api } from "@/lib/api";

const sources: Record<string, string> = { lugares: "/search/places", cidades: "/search/cities", clientes: "/search/customers" };

/**
 * Busca enquanto se digita. É POST para um CNPJ/CPF digitado não ficar em endereços e registros de acesso.
 * Quem pode consultar é conferido pela API.
 */
export async function POST(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!Object.hasOwn(sources, tipo)) return new Response(null, { status: 404 });
  const body: unknown = await request.json().catch(() => null);
  const q = String((body as { q?: unknown } | null)?.q ?? "").slice(0, 100);
  const result = await api<Suggestion[]>(`${sources[tipo]}?${new URLSearchParams({ q })}`);
  return Response.json(result.ok ? result.data : [], { status: result.status, headers: { "cache-control": "no-store" } });
}
