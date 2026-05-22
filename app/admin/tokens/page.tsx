import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";
import { Sidebar, MobileTopbar } from "@/components/sidebar";
import { TokenManager } from "./token-manager";
import { createServiceClient } from "@/lib/supabase/service";
import { listTokens } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }

  const tokens = await listTokens(createServiceClient());

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopbar email={user?.email ?? null} />
      <main className="md:pl-20 lg:pl-24">
        <div className="mx-auto max-w-4xl px-6 md:px-10 py-10 md:py-14">
          <header className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900">
              Tokens MCP
            </h1>
            <p className="mt-3 text-zinc-500 max-w-xl">
              Chaque utilisateur (toi, Théo, Vladimir) a son propre token Bearer. Affiché une seule fois à la création — copie-le tout de suite.
            </p>
          </header>
          <TokenManager initialTokens={tokens} />
        </div>
      </main>
    </div>
  );
}
