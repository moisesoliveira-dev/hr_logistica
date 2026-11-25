import { cookies } from "next/headers";
import { apiUrl, internalHeaders } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth/shared";

/** Qualquer imagem do acervo, para quem é do marketing ou administrador (a API confere). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const response = await fetch(apiUrl(`/content/media/${id}/file`), {
    headers: { ...(await internalHeaders()), authorization: `Bearer ${token.replace(/[^\w-]/g, "")}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return new Response(null, { status: response?.status ?? 502 });
  return new Response(response.body, {
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/octet-stream", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
