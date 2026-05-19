import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed Middleware → Proxy (same runtime, new file convention).
// The supabase helper keeps its @supabase/ssr-canonical name `updateSession`
// and lives at lib/supabase/middleware.ts per that package's docs.

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Gate every non-public route on a signed-in user.
  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    // Preserve cookies that updateSession may have set during the refresh.
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }

  // Privacy: ensure every response is unindexable, belt-and-braces with the
  // meta tag in the root layout.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
