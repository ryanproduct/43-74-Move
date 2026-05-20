import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed Middleware → Proxy (same runtime, new file convention).
// The supabase helper keeps its @supabase/ssr-canonical name `updateSession`
// and lives at lib/supabase/middleware.ts per that package's docs.

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  // API routes manage their own auth (e.g. /api/cron/* gates on CRON_SECRET),
  // so they bypass the session-based redirect-to-login.
  const isApi = pathname.startsWith("/api/");
  const isPublic = isApi || PUBLIC_PATHS.has(pathname);

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
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico
     * - Any file with an extension that should be served as-is:
     *   images (svg/png/jpg/jpeg/gif/webp/ico),
     *   PWA chrome (manifest.json, sw.js),
     *   fonts (woff/woff2/ttf), txt (e.g. robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|woff|woff2|ttf|txt)$).*)",
  ],
};
