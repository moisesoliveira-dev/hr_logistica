import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await api<{ token: string; image: string }>("/captcha");
  return Response.json(result.ok ? result.data : { error: result.error.message }, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
