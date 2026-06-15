import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const publicPaths = [
    "/login",
    "/register",
    "/check-email",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
  ]

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith("/api")
  const isStatic =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon")

  if (isStatic) return NextResponse.next()
  if (isApi && !isPublic && !isLoggedIn) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
