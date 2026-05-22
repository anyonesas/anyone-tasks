import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white grid place-items-center text-xs font-semibold">
              a
            </div>
            <span className="font-semibold tracking-tight">anyone tasks</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900"
            >
              Demandes
            </Link>
            {isAdmin && (
              <Link href="/admin/tokens" className="text-zinc-600 hover:text-zinc-900">
                Tokens
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500 hidden sm:inline">{user?.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-zinc-500 hover:text-zinc-900 text-sm"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
