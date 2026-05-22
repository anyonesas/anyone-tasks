import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequest } from "@/lib/requests";
import { Header } from "@/components/header";
import { StatusBadge, TypeBadge, ScoreBadge } from "@/components/badges";
import { formatDateTime } from "@/lib/utils";
import { RespondForm } from "./respond-form";
import { DigestBlock } from "./digest-block";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const req = await getRequest(supabase, id);
  if (!req) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-6">
          ← Retour aux demandes
        </Link>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  {req.project}
                </span>
                <TypeBadge type={req.type} />
              </div>
              <h1 className="text-2xl font-semibold text-zinc-900 leading-tight">
                {req.title}
              </h1>
              <p className="text-sm text-zinc-500 mt-2">
                Soumis par {req.submitted_by_name ?? req.submitted_by_email} · {formatDateTime(req.created_at)}
              </p>
            </div>
            <StatusBadge status={req.status} />
          </div>

          {/* Scores */}
          <div className="flex flex-wrap gap-2 mb-6">
            <ScoreBadge label="Urgence" score={req.urgency_score} />
            <ScoreBadge label="Criticité" score={req.criticality_score} />
            <ScoreBadge label="Complexité" score={req.complexity_score} />
          </div>

          {/* Request */}
          <Section title="Demande">
            <p className="text-zinc-800 whitespace-pre-wrap">{req.request}</p>
          </Section>

          {req.context && (
            <Section title="Contexte">
              <p className="text-zinc-700 whitespace-pre-wrap text-sm">{req.context}</p>
            </Section>
          )}

          {/* Score reasons */}
          {(req.complexity_reason || req.criticality_reason || req.urgency_reason) && (
            <Section title="Analyse">
              <dl className="space-y-2 text-sm">
                {req.urgency_reason && (
                  <div>
                    <dt className="font-medium text-zinc-900 inline">Urgence ({req.urgency_score}/5) — </dt>
                    <dd className="inline text-zinc-700">{req.urgency_reason}</dd>
                  </div>
                )}
                {req.criticality_reason && (
                  <div>
                    <dt className="font-medium text-zinc-900 inline">Criticité ({req.criticality_score}/5) — </dt>
                    <dd className="inline text-zinc-700">{req.criticality_reason}</dd>
                  </div>
                )}
                {req.complexity_reason && (
                  <div>
                    <dt className="font-medium text-zinc-900 inline">Complexité ({req.complexity_score}/5) — </dt>
                    <dd className="inline text-zinc-700">{req.complexity_reason}</dd>
                  </div>
                )}
              </dl>
            </Section>
          )}

          {req.safety_notes && (
            <Section title="Garde-fous">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{req.safety_notes}</p>
              </div>
            </Section>
          )}

          {req.files && req.files.length > 0 && (
            <Section title="Fichiers / références">
              <ul className="space-y-2">
                {req.files.map((f, i) => (
                  <li key={i} className="border border-zinc-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm text-zinc-900">{f.name}</span>
                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          ouvrir →
                        </a>
                      )}
                    </div>
                    {f.description && <p className="text-sm text-zinc-600 mt-1">{f.description}</p>}
                    {f.content && (
                      <pre className="text-xs bg-zinc-50 border border-zinc-100 rounded p-2 mt-2 overflow-x-auto">
                        {f.content}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {req.digest && (
            <Section title="Digest pour le dev (à copier-coller dans Claude)">
              <DigestBlock digest={req.digest} />
            </Section>
          )}

          {/* Response */}
          {req.response ? (
            <Section title="Réponse">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{req.response}</p>
                <p className="text-xs text-emerald-700 mt-2">
                  Par {req.responded_by_email} · {req.response_at && formatDateTime(req.response_at)}
                </p>
              </div>
            </Section>
          ) : (
            <Section title="Répondre / clôturer">
              <RespondForm id={req.id} />
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
