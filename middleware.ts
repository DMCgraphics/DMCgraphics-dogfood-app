import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "auth_token"

const protectedRoutes = ["/dashboard", "/profile", "/orders"]
const authRoutes = ["/auth/login", "/auth/signup"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next()
  }

  if (pathname === "/recipes" || pathname.startsWith("/recipes/")) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get(JWT_COOKIE_NAME)?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("returnUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Log page visits for analytics
  console.log(`[v0] page_visit: ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
