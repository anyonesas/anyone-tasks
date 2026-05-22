import Link from "next/link";
import type { TaskRequest } from "@/lib/types";
import { StatusBadge, TypeBadge, ScoreBadge } from "@/components/badges";
import { formatRelative } from "@/lib/utils";

export function RequestCard({ req }: { req: TaskRequest }) {
  return (
    <Link
      href={`/requests/${req.id}`}
      className="block bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {req.project}
            </span>
            <TypeBadge type={req.type} />
          </div>
          <h3 className="font-medium text-zinc-900 truncate">{req.title}</h3>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{req.request}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="flex flex-wrap gap-1.5">
          <ScoreBadge label="Urgence" score={req.urgency_score} />
          <ScoreBadge label="Crit." score={req.criticality_score} />
          <ScoreBadge label="Complexité" score={req.complexity_score} />
        </div>
        <div className="text-xs text-zinc-400 whitespace-nowrap">
          {req.submitted_by_name ?? req.submitted_by_email.split("@")[0]} · {formatRelative(req.created_at)}
        </div>
      </div>
    </Link>
  );
}
