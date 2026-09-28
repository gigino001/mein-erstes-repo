import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Optimistischer Check (nur Cookie, keine DB-Abfrage) — die eigentliche,
// sichere Prüfung passiert zusätzlich in jeder Admin-Seite/Server Action
// über verifyAdminSession().
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLoginRoute = path === "/admin/login";

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(cookie);
  const isAuthenticated = Boolean(session?.admin);

  if (!isLoginRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
