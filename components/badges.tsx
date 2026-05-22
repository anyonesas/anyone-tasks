import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  type RequestStatus,
  type RequestType,
} from "@/lib/types";

const STATUS_CLASSES: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-zinc-100 text-zinc-600 border-zinc-200",
  info_provided: "bg-violet-50 text-violet-700 border-violet-200",
};

const TYPE_CLASSES: Record<RequestType, string> = {
  feature: "bg-zinc-100 text-zinc-700",
  bug: "bg-red-50 text-red-700",
  question: "bg-blue-50 text-blue-700",
  info: "bg-zinc-100 text-zinc-700",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: RequestType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        TYPE_CLASSES[type],
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function scoreColor(label: string, score: number): string {
  // Urgency / criticality: red-ish high. Complexity: more neutral.
  if (label === "Complexité") {
    return ["bg-zinc-100 text-zinc-700", "bg-zinc-100 text-zinc-700", "bg-amber-50 text-amber-700", "bg-orange-50 text-orange-700", "bg-orange-100 text-orange-800"][score - 1];
  }
  return ["bg-zinc-100 text-zinc-700", "bg-amber-50 text-amber-700", "bg-orange-50 text-orange-700", "bg-red-50 text-red-700", "bg-red-100 text-red-800"][score - 1];
}

export function ScoreBadge({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-50 text-zinc-400">
        <span className="font-medium">{label}</span>
        <span>—</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs",
        scoreColor(label, score),
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="font-mono">{score}/5</span>
    </span>
  );
}
