import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except: _next, static files, MCP endpoint (uses Bearer auth).
    "/((?!_next/static|_next/image|favicon.ico|api/mcp).*)",
  ],
};
