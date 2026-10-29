import { NextResponse } from "next/server";

// Pages accessibles sans être connecté
const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/resend-verification"];
export function proxy(request) {
  const token = request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Pas de token et page protégée → redirection vers la connexion
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Token présent et sur la page de connexion → redirection vers le tableau de bord
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|images/).*)",
  ],
};