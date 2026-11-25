import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/auth/shared";

/**
 * Filtro preliminar: sem cookie, nem chega a renderizar o portal.
 * A validação de verdade (no banco) acontece em requireUser(), em cada página e ação.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/portal/:path*"] };
