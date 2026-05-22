import { createClient } from "@/lib/supabase/server";
import { listRequests } from "@/lib/requests";
import { Sidebar, MobileTopbar } from "@/components/sidebar";
import { Filters } from "@/components/filters";
import { RequestCard } from "@/components/request-card";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  project?: string;
  type?: string;
  urgency_min?: string;
};

function normalizeFilters(sp: SearchParams) {
  const status = sp.status === "all" ? undefined : (sp.status ?? "open");
  return {
    status: status as
      | "pending"
      | "in_progress"
      | "completed"
      | "rejected"
      | "info_provided"
      | "open"
      | undefined,
    project: sp.project || undefined,
    type: sp.type as "feature" | "bug" | "question" | "info" | undefined,
    urgency_min: sp.urgency_min ? parseInt(sp.urgency_min, 10) : undefined,
    limit: 200 as const,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const filters = normalizeFilters(sp);
  const [requests, { data: { user } }] = await Promise.all([
    listRequests(supabase, filters),
    supabase.auth.getUser(),
  ]);

  // Derive projects list + open count from the same dataset — no extra query.
  const projects = Array.from(new Set(requests.map((r) => r.project))).sort();
  const openCount = requests.filter(
    (r) => r.status === "pending" || r.status === "in_progress",
  ).length;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopbar email={user?.email ?? null} />

      <main className="md:pl-20 lg:pl-24">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-14">
          <header className="mb-10">
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-zinc-900">
              Demandes
            </h1>
            <p className="mt-3 text-zinc-500">
              {requests.length === 0
                ? "Aucune demande encore — utilise /ask dans Claude pour en envoyer."
                : `${openCount} ouverte${openCount > 1 ? "s" : ""} · ${requests.length} au total dans cette vue`}
            </p>
          </header>

          <div className="mb-10">
            <Filters projects={projects} />
          </div>

          {requests.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {requests.map((req) => (
                <RequestCard key={req.id} req={req} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-zinc-200/70 rounded-3xl p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 grid place-items-center mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-semibold text-zinc-900">
        Rien à traiter ici
      </h2>
      <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
        Quand quelqu&apos;un envoie une demande via <code className="font-mono text-xs px-1.5 py-0.5 bg-zinc-100 rounded">/ask</code> dans Claude,
        elle apparaît sur cette page sous forme de carte colorée.
      </p>
    </div>
  );
}
