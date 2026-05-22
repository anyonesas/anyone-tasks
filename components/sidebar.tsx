import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-20 lg:w-24 bg-white border-r border-zinc-200/70 z-10">
      <div className="flex flex-col items-center py-6 gap-6 h-full">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight text-zinc-900 [writing-mode:vertical-lr] sm:[writing-mode:horizontal-tb]">
          anyone
        </Link>

        <Link
          href="/"
          className="w-11 h-11 rounded-full bg-zinc-900 text-white grid place-items-center text-lg leading-none shadow-sm hover:scale-105 transition"
          aria-label="Demandes"
          title="Demandes"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/tokens"
            className="w-11 h-11 rounded-full bg-white border border-zinc-200 text-zinc-700 grid place-items-center hover:bg-zinc-50 transition"
            aria-label="Tokens"
            title="Tokens MCP"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </Link>
        )}

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 grid place-items-center text-sm font-semibold"
            title={user?.email ?? ""}
          >
            {initial}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Déconnexion"
              className="w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 grid place-items-center transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileTopbar({ email }: { email: string | null }) {
  return (
    <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-zinc-200">
      <Link href="/" className="font-display font-semibold tracking-tight text-zinc-900">
        anyone tasks
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">{email}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-900">
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}
