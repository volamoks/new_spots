import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register"]
  const isHomePage = pathname === "/"

  // Redirect authorized users from home page to role-specific pages
  if (isHomePage && token) {
    const roleBasedRedirects = {
      SUPPLIER: "/supplier/bookings",
      CATEGORY_MANAGER: "/category-manager",
      DMP_MANAGER: "/dmp-manager",
    }

    const userRole = token.role as keyof typeof roleBasedRedirects
    if (userRole in roleBasedRedirects) {
      return NextResponse.redirect(new URL(roleBasedRedirects[userRole], request.url))
    }
  }

  // Check if the path is public
  if (publicPaths.includes(pathname) || isHomePage) {
    return NextResponse.next()
  }

  // Redirect to login if there is no token
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // Allow access to profile page for any authenticated user
  if (pathname.startsWith("/profile")) {
    return NextResponse.next()
  }

  // Role-based route protection
  if (token.role) {
    const roleBasedPaths = {
      SUPPLIER: ["/zones", "/supplier"],
      CATEGORY_MANAGER: ["/category-manager"],
      DMP_MANAGER: ["/dmp-manager"],
    }

    const userRole = token.role as keyof typeof roleBasedPaths
    const allowedPaths = roleBasedPaths[userRole] || []

    // Check if user has access to the current path
    const hasAccess = allowedPaths.some((path) => pathname.startsWith(path))

    if (!hasAccess) {
      // Redirect to home page if user doesn't have access
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
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

