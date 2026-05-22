"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RequestStatus } from "@/lib/types";

const STATUSES: { value: RequestStatus; label: string; tone: "primary" | "info" | "danger" }[] = [
  { value: "completed", label: "Marquer traitée", tone: "primary" },
  { value: "info_provided", label: "Info fournie", tone: "info" },
  { value: "in_progress", label: "En cours", tone: "info" },
  { value: "rejected", label: "Refuser", tone: "danger" },
];

export function RespondForm({ id }: { id: string }) {
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(status: RequestStatus) {
    if (!response.trim() && status !== "in_progress") {
      setError("Ajoute une réponse (ou utilise 'En cours' pour juste changer le statut).");
      return;
    }
    setError(null);
    startTransition(async () => {
      const endpoint =
        status === "in_progress" && !response.trim()
          ? `/api/requests/${id}`
          : `/api/requests/${id}/respond`;
      const body =
        status === "in_progress" && !response.trim()
          ? { status }
          : { response: response.trim(), status };

      const res = await fetch(endpoint, {
        method: endpoint.endsWith("/respond") ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(typeof j?.error === "string" ? j.error : "Erreur lors de la mise à jour.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={4}
        placeholder="Réponse, info, ou commentaire pour clôturer la demande…"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={pending}
            onClick={() => submit(s.value)}
            className={
              "px-3 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-50 " +
              (s.tone === "primary"
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : s.tone === "danger"
                  ? "bg-white border border-zinc-200 text-red-600 hover:bg-red-50"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50")
            }
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
