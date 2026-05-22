"use client";

import { useEffect, useMemo, useState } from "react";
import type { TaskRequest } from "@/lib/types";
import { RequestCard } from "@/components/request-card";
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

function readInitialFilters() {
  if (typeof window === "undefined") {
    return { status: "open", urgencyMin: "", project: "" };
  }
  const p = new URLSearchParams(window.location.search);
  return {
    status: p.get("status") ?? "open",
    urgencyMin: p.get("urgency_min") ?? "",
    project: p.get("project") ?? "",
  };
}

export function RequestsBoard({
  initialRequests,
}: {
  initialRequests: TaskRequest[];
}) {
  const initial = readInitialFilters();
  const [status, setStatus] = useState(initial.status);
  const [urgencyMin, setUrgencyMin] = useState(initial.urgencyMin);
  const [project, setProject] = useState(initial.project);

  // Push filter state into the URL without re-running the server component.
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "open") params.set("status", status);
    if (urgencyMin) params.set("urgency_min", urgencyMin);
    if (project) params.set("project", project);
    const qs = params.toString();
    const url = qs ? `/?${qs}` : "/";
    window.history.replaceState({}, "", url);
  }, [status, urgencyMin, project]);

  const projects = useMemo(
    () => Array.from(new Set(initialRequests.map((r) => r.project))).sort(),
    [initialRequests],
  );

  const filtered = useMemo(() => {
    const urgencyThreshold = urgencyMin ? parseInt(urgencyMin, 10) : null;
    return initialRequests.filter((r) => {
      if (status === "open") {
        if (r.status !== "pending" && r.status !== "in_progress") return false;
      } else if (status !== "all") {
        if (r.status !== status) return false;
      }
      if (urgencyThreshold !== null) {
        if (r.urgency_score === null || r.urgency_score < urgencyThreshold)
          return false;
      }
      if (project && r.project !== project) return false;
      return true;
    });
  }, [initialRequests, status, urgencyMin, project]);

  const openCount = useMemo(
    () =>
      initialRequests.filter(
        (r) => r.status === "pending" || r.status === "in_progress",
      ).length,
    [initialRequests],
  );

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-14">
      <header className="mb-10">
        <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-zinc-900">
          Demandes
        </h1>
        <p className="mt-3 text-zinc-500">
          {initialRequests.length === 0
            ? "Aucune demande encore — utilise /ask dans Claude pour en envoyer."
            : `${openCount} ouverte${openCount > 1 ? "s" : ""} · ${filtered.length} dans cette vue`}
        </p>
      </header>

      <div className="mb-10 flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
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
          value={urgencyMin}
          onChange={(e) => setUrgencyMin(e.target.value)}
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
            onChange={(e) => setProject(e.target.value)}
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

      {filtered.length === 0 ? (
        <EmptyState empty={initialRequests.length === 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ empty }: { empty: boolean }) {
  return (
    <div className="bg-white border border-zinc-200/70 rounded-3xl p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 grid place-items-center mb-5">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-semibold text-zinc-900">
        {empty ? "Rien à traiter ici" : "Aucune demande pour ce filtre"}
      </h2>
      <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
        {empty ? (
          <>
            Quand quelqu&apos;un envoie une demande via{" "}
            <code className="font-mono text-xs px-1.5 py-0.5 bg-zinc-100 rounded">
              /ask
            </code>{" "}
            dans Claude, elle apparaît ici sous forme de carte.
          </>
        ) : (
          <>Essaie un autre statut ou supprime les filtres.</>
        )}
      </p>
    </div>
  );
}
