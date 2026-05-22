import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";
import { Header } from "@/components/header";
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
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-6">
          Tokens MCP
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Chaque utilisateur (toi, Théo, ton frère) a son propre token Bearer pour le MCP.
          Le token n'est affiché qu'une seule fois à la création — copie-le tout de suite.
        </p>
        <TokenManager initialTokens={tokens} />
      </main>
    </div>
  );
}
