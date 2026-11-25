import { apiUrl, internalHeaders } from "@/lib/api";

/** Imagens publicadas pelo marketing (só capas de notícias publicadas). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const response = await fetch(apiUrl(`/public/media/${id}`), { headers: await internalHeaders(), cache: "no-store" }).catch(() => null);
  if (!response?.ok) return new Response(null, { status: response?.status === 404 ? 404 : 502 });
  return new Response(response.body, {
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/octet-stream", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
