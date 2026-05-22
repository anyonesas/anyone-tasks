"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "open", label: "Ouvertes" },
  { value: "pending", label: "À traiter" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Traitées" },
  { value: "info_provided", label: "Info fournie" },
  { value: "rejected", label: "Refusées" },
  { value: "all", label: "Toutes" },
];

const URGENCY_FILTERS = [
  { value: "", label: "Toutes urgences" },
  { value: "5", label: "Urgence ≥ 5" },
  { value: "4", label: "Urgence ≥ 4" },
  { value: "3", label: "Urgence ≥ 3" },
];

export function Filters({ projects }: { projects: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "open";
  const urgency = sp.get("urgency_min") ?? "";
  const project = sp.get("project") ?? "";

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "" || v === "all") params.delete(k);
        else params.set(k, v);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, sp],
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => set({ status: f.value })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition",
              status === f.value
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <select
        value={urgency}
        onChange={(e) => set({ urgency_min: e.target.value || undefined })}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        {URGENCY_FILTERS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>

      {projects.length > 0 && (
        <select
          value={project}
          onChange={(e) => set({ project: e.target.value || undefined })}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Tous projets</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
