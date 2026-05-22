"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
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

export function Filters({ projects }: { projects: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

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
      const q = params.toString();
      startTransition(() => router.push(q ? `/?${q}` : "/"));
    },
    [router, sp],
  );

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", pending && "opacity-70")}>
      {STATUS_FILTERS.map((f) => {
        const active = status === f.value;
        return (
          <button
            key={f.value}
            onClick={() => set({ status: f.value })}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition",
              active
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200/70",
            )}
          >
            {f.label}
          </button>
        );
      })}

      <div className="w-px h-6 bg-zinc-200 mx-1" />

      <select
        value={urgency}
        onChange={(e) => set({ urgency_min: e.target.value || undefined })}
        className="rounded-full bg-white border border-zinc-200/70 px-4 py-2 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <option value="">Toutes urgences</option>
        <option value="5">Urgence ≥ 5</option>
        <option value="4">Urgence ≥ 4</option>
        <option value="3">Urgence ≥ 3</option>
      </select>

      {projects.length > 0 && (
        <select
          value={project}
          onChange={(e) => set({ project: e.target.value || undefined })}
          className="rounded-full bg-white border border-zinc-200/70 px-4 py-2 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
