import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isAllowedEmail } from "@/lib/env";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const url = request.nextUrl;
  const path = url.pathname;

  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/auth/") ||
    path.startsWith("/api/mcp") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico";

  if (isPublic) return response;

  // For redirects we only need to know if there's any signed-in session.
  // getSession() reads from cookies (no network), getUser() would hit Supabase Auth on every page.
  // Server components / API routes still call getUser() to validate the JWT for sensitive ops.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (!isAllowedEmail(session.user.email)) {
    await supabase.auth.signOut();
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(redirect);
  }

  return response;
}
