import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const isLoginPage = request.nextUrl.pathname === "/login";

  // Si pas de token et pas sur la page login → redirect vers login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si token présent et sur la page login → redirect vers dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};