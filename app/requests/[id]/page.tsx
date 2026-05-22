import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequest } from "@/lib/requests";
import { Sidebar, MobileTopbar } from "@/components/sidebar";
import { formatDateTime, cn } from "@/lib/utils";
import { paletteForCriticality, STATUS_ACCENT } from "@/lib/colors";
import { TYPE_LABELS } from "@/lib/types";
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
  const [req, { data: { user } }] = await Promise.all([
    getRequest(supabase, id),
    supabase.auth.getUser(),
  ]);
  if (!req) notFound();

  const palette = paletteForCriticality(req.criticality_score);
  const accent = STATUS_ACCENT[req.status];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileTopbar email={user?.email ?? null} />

      <main className="md:pl-20 lg:pl-24">
        <div className="mx-auto max-w-4xl px-6 md:px-10 py-8 md:py-12">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1.5 mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </Link>

          {/* Hero card */}
          <div className={cn("rounded-3xl p-8 md:p-10 border", palette.bg, palette.border)}>
            <div className="flex items-center justify-between mb-6">
              <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", palette.chip)}>
                {req.project}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-900/70">
                  {TYPE_LABELS[req.type]}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-900/30" />
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900/70">
                  <span className={cn("w-2 h-2 rounded-full", accent.dot)} />
                  {accent.label}
                </span>
              </div>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 leading-tight">
              {req.title}
            </h1>

            <p className={cn("text-sm mt-3", palette.meta)}>
              {req.submitted_by_name ?? req.submitted_by_email} · {formatDateTime(req.created_at)}
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <BigScore label="Urgence" score={req.urgency_score} />
              <BigScore label="Criticité" score={req.criticality_score} />
              <BigScore label="Complexité" score={req.complexity_score} />
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-3xl border border-zinc-200/70 p-8 md:p-10 mt-6 space-y-8">
            <Section title="Demande">
              <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed">{req.request}</p>
            </Section>

            {req.context && (
              <Section title="Contexte">
                <p className="text-zinc-700 whitespace-pre-wrap text-[15px] leading-relaxed">{req.context}</p>
              </Section>
            )}

            {(req.complexity_reason || req.criticality_reason || req.urgency_reason) && (
              <Section title="Analyse des scores">
                <dl className="space-y-2 text-sm">
                  {req.urgency_reason && (
                    <ReasonRow label={`Urgence ${req.urgency_score}/5`} text={req.urgency_reason} />
                  )}
                  {req.criticality_reason && (
                    <ReasonRow label={`Criticité ${req.criticality_score}/5`} text={req.criticality_reason} />
                  )}
                  {req.complexity_reason && (
                    <ReasonRow label={`Complexité ${req.complexity_score}/5`} text={req.complexity_reason} />
                  )}
                </dl>
              </Section>
            )}

            {req.safety_notes && (
              <Section title="Garde-fous">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{req.safety_notes}</p>
                </div>
              </Section>
            )}

            {req.files && req.files.length > 0 && (
              <Section title="Fichiers / références">
                <ul className="space-y-2">
                  {req.files.map((f, i) => (
                    <li key={i} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-sm text-zinc-900">{f.name}</span>
                        {f.url && (
                          <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-zinc-900">
                            ouvrir →
                          </a>
                        )}
                      </div>
                      {f.description && (
                        <p className="text-sm text-zinc-600 mt-1.5">{f.description}</p>
                      )}
                      {f.content && (
                        <pre className="text-xs bg-white rounded-lg p-3 mt-2 overflow-x-auto border border-zinc-100">
                          {f.content}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {req.digest && (
              <Section
                title="Digest"
                hint="À coller dans une session Claude Code dans le bon projet"
              >
                <DigestBlock digest={req.digest} />
              </Section>
            )}

            {req.response ? (
              <Section title="Réponse">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                  <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{req.response}</p>
                  <p className="text-xs text-emerald-700 mt-3">
                    {req.responded_by_email}
                    {req.response_at && ` · ${formatDateTime(req.response_at)}`}
                  </p>
                </div>
              </Section>
            ) : (
              <Section title="Répondre / clôturer">
                <RespondForm id={req.id} />
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-[0.12em]">
          {title}
        </h2>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function ReasonRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="font-medium text-zinc-900 inline">{label} — </dt>
      <dd className="inline text-zinc-700">{text}</dd>
    </div>
  );
}

function BigScore({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  if (score === null) {
    return (
      <div className="bg-zinc-900/5 rounded-xl px-3 py-1.5 text-zinc-900/40 text-xs">
        <div className="font-medium">{label}</div>
        <div className="font-mono text-sm">—</div>
      </div>
    );
  }
  return (
    <div className="bg-zinc-900/10 rounded-xl px-3 py-1.5 text-zinc-900">
      <div className="text-[11px] font-medium opacity-70">{label}</div>
      <div className="font-mono text-sm font-semibold">{score}/5</div>
    </div>
  );
}
