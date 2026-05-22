import Link from "next/link";
import type { TaskRequest } from "@/lib/types";
import { formatRelative, cn } from "@/lib/utils";
import { paletteFor, STATUS_ACCENT } from "@/lib/colors";

export function RequestCard({ req }: { req: TaskRequest }) {
  const palette = paletteFor(req.project);
  const accent = STATUS_ACCENT[req.status];
  const submitter = req.submitted_by_name ?? req.submitted_by_email.split("@")[0];

  return (
    <Link
      href={`/requests/${req.id}`}
      className={cn(
        "group relative aspect-[5/4] flex flex-col rounded-3xl p-6 transition-all border",
        palette.bg,
        palette.border,
        palette.hover,
        "hover:-translate-y-1 hover:shadow-lg shadow-sm",
      )}
    >
      {/* Top: project chip + status dot */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium", palette.chip)}>
          {req.project}
        </span>
        <span
          className={cn("w-2.5 h-2.5 rounded-full", accent.dot)}
          title={accent.label}
        />
      </div>

      {/* Title */}
      <h3 className="font-display text-xl font-semibold text-zinc-900 leading-tight tracking-tight line-clamp-3">
        {req.title}
      </h3>

      {/* Preview */}
      <p className="mt-2 text-sm text-zinc-800/70 line-clamp-2">{req.request}</p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: scores + meta */}
      <div className="flex items-end justify-between gap-2 mt-4">
        <div className={cn("text-xs", palette.meta)}>
          <div className="font-medium text-zinc-900/80">{submitter}</div>
          <div>{formatRelative(req.created_at)}</div>
        </div>
        <div className="flex gap-1">
          {req.urgency_score !== null && (
            <ScorePill label="U" score={req.urgency_score} />
          )}
          {req.criticality_score !== null && (
            <ScorePill label="C" score={req.criticality_score} />
          )}
          {req.complexity_score !== null && (
            <ScorePill label="X" score={req.complexity_score} />
          )}
        </div>
      </div>
    </Link>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-900/10 text-zinc-900"
      title={`${label} = ${score}/5`}
    >
      {label}
      {score}
    </span>
  );
}
