import { createClient } from "@/lib/supabase/server";
import { listRequests } from "@/lib/requests";
import { Header } from "@/components/header";
import { Filters } from "@/components/filters";
import { RequestCard } from "@/components/request-card";
import { STATUS_LABELS } from "@/lib/types";

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
  const requests = await listRequests(supabase, filters);

  // Build a project list from the data we already have, plus a query for all distinct projects.
  const { data: allProjectsRaw } = await supabase
    .from("requests")
    .select("project")
    .order("project");
  const projects = Array.from(
    new Set((allProjectsRaw ?? []).map((r) => r.project)),
  );

  const totals = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
    info_provided: 0,
  };
  const { data: statusCounts } = await supabase.from("requests").select("status");
  (statusCounts ?? []).forEach((r) => {
    totals[r.status as keyof typeof totals]++;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Demandes</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {totals.pending} à traiter · {totals.in_progress} en cours · {totals.completed} traitées
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Filters projects={projects} />
        </div>

        {requests.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl py-16 text-center">
            <p className="text-zinc-500">Aucune demande pour ce filtre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
