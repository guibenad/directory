import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveDirectorySlugFromHost } from "@/lib/tenant-edge";

const SUPER_ADMIN_PREFIXES = ["/super-admin"];
const ADMIN_PREFIXES = ["/admin"];
const COMPANY_PREFIXES = ["/mon-compte"];

function isPrefixed(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Résolution tenant par hostname (sauf pour super-admin)
  const host = req.headers.get("host") ?? "";
  const slug = resolveDirectorySlugFromHost(host);

  const requestHeaders = new Headers(req.headers);
  if (slug && !isPrefixed(pathname, SUPER_ADMIN_PREFIXES)) {
    requestHeaders.set("x-directory-slug", slug);
  }

  // 2) Protection des zones privées
  const needsSuperAdmin = isPrefixed(pathname, SUPER_ADMIN_PREFIXES);
  const needsDirectoryAdmin = isPrefixed(pathname, ADMIN_PREFIXES);
  const needsCompany = isPrefixed(pathname, COMPANY_PREFIXES);

  if (needsSuperAdmin || needsDirectoryAdmin || needsCompany) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string | undefined;

    if (needsSuperAdmin && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (needsDirectoryAdmin && role !== "SUPER_ADMIN" && role !== "DIRECTORY_ADMIN") {
      return NextResponse.redirect(new URL("/mon-compte", req.url));
    }
    if (needsCompany && role !== "COMPANY") {
      return NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/super-admin" : "/admin", req.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Matche toutes les pages sauf assets et API internes
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|api/stripe/webhook).*)",
  ],
};
