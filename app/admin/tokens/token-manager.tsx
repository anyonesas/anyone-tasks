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
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 md:p-8">
        <h2 className="font-display font-semibold text-zinc-900 mb-5 text-lg">Créer un token</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="email"
            placeholder="user@anyone.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
          />
          <input
            type="text"
            placeholder="Nom (optionnel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
          />
          <input
            type="text"
            placeholder="Label (ex: claude-laptop)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
          />
        </div>
        <button
          onClick={create}
          disabled={pending}
          className="mt-4 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Création…" : "Créer le token"}
        </button>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {issued && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-amber-900 mb-3">
              Token créé — copie-le maintenant, il ne sera plus jamais affiché.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-white border border-amber-200 rounded-xl px-3 py-2 break-all">
                {issued}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(issued)}
                className="text-xs bg-amber-900 text-white px-4 py-2 rounded-full hover:bg-amber-800 font-medium"
              >
                Copier
              </button>
              <button
                onClick={() => setIssued(null)}
                className="text-xs text-amber-700 hover:text-amber-900 px-2"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-zinc-200/70 rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Email</th>
              <th className="px-5 py-3 text-left font-medium">Label</th>
              <th className="px-5 py-3 text-left font-medium">Créé</th>
              <th className="px-5 py-3 text-left font-medium">Utilisé</th>
              <th className="px-5 py-3 text-left font-medium">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tokens.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-3 font-medium text-zinc-900">{t.user_email}</td>
                <td className="px-5 py-3 text-zinc-600">{t.label ?? "—"}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{formatDateTime(t.created_at)}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">
                  {t.last_used_at ? formatDateTime(t.last_used_at) : "—"}
                </td>
                <td className="px-5 py-3">
                  {t.revoked_at ? (
                    <span className="text-xs text-zinc-500">Révoqué</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Actif
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {!t.revoked_at && (
                    <button
                      onClick={() => revoke(t.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Révoquer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-400 text-sm">
                  Aucun token. Crée-en un pour permettre l&apos;accès au MCP.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
