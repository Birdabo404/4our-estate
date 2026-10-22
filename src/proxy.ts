import { NextResponse, type NextRequest } from "next/server";

import { jwtExpired, SESSION_COOKIE } from "@/lib/api/token";

function dropSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-4our-pathname", nextPath);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const expired = Boolean(token && jwtExpired(token));
  const signedIn = Boolean(token) && !expired;

  if (request.nextUrl.pathname.startsWith("/dashboard") && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", nextPath);
    const redirect = NextResponse.redirect(url);
    if (token) dropSession(redirect);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (expired) dropSession(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
