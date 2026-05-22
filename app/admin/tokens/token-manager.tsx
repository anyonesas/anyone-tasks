"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApiToken } from "@/lib/tokens";
import { formatDateTime } from "@/lib/utils";

export function TokenManager({ initialTokens }: { initialTokens: ApiToken[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function create() {
    if (!email) {
      setError("Email requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_email: email,
          user_name: name || undefined,
          label: label || undefined,
        }),
      });
      if (!res.ok) {
        setError("Erreur lors de la création.");
        return;
      }
      const j = await res.json();
      setIssued(j.token);
      setTokens([j.row, ...tokens]);
      setEmail("");
      setName("");
      setLabel("");
      router.refresh();
    });
  }

  function revoke(id: string) {
    if (!confirm("Révoquer ce token ?")) return;
    startTransition(async () => {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setError("Erreur lors de la révocation.");
        return;
      }
      setTokens(tokens.map((t) => (t.id === id ? { ...t, revoked_at: new Date().toISOString() } : t)));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Créer un token</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="email"
            placeholder="user@anyone.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            type="text"
            placeholder="Nom (optionnel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            type="text"
            placeholder="Label (ex: claude-laptop)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <button
          onClick={create}
          disabled={pending}
          className="mt-3 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Création..." : "Créer"}
        </button>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {issued && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">
              Token créé — copie-le maintenant, il ne sera plus jamais affiché :
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-white border border-amber-200 rounded px-2 py-1.5 break-all">
                {issued}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(issued)}
                className="text-xs bg-amber-900 text-white px-3 py-1.5 rounded hover:bg-amber-800"
              >
                Copier
              </button>
              <button
                onClick={() => setIssued(null)}
                className="text-xs text-amber-700 hover:text-amber-900"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">Créé</th>
              <th className="px-4 py-3 text-left font-medium">Dernière utilisation</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tokens.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">{t.user_email}</td>
                <td className="px-4 py-3 text-zinc-600">{t.label ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{formatDateTime(t.created_at)}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {t.last_used_at ? formatDateTime(t.last_used_at) : "—"}
                </td>
                <td className="px-4 py-3">
                  {t.revoked_at ? (
                    <span className="text-xs text-zinc-500">Révoqué</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Actif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!t.revoked_at && (
                    <button
                      onClick={() => revoke(t.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Révoquer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  Aucun token. Crée-en un pour permettre l'accès au MCP.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
