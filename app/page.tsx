import { createClient } from "@/lib/supabase/server";
import { listRequests } from "@/lib/requests";
import { Sidebar, MobileTopbar } from "@/components/sidebar";
import { RequestsBoard } from "@/components/requests-board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const [
    requests,
    {
      data: { user },
    },
  ] = await Promise.all([
    listRequests(supabase, { limit: 500 }),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopbar email={user?.email ?? null} />
      <main className="md:pl-20 lg:pl-24">
        <RequestsBoard initialRequests={requests} />
      </main>
    </div>
  );
}
