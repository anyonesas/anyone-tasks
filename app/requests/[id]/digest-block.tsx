"use client";

import { useState } from "react";

export function DigestBlock({ digest }: { digest: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative bg-zinc-900 text-zinc-100 rounded-lg p-4 font-mono text-xs leading-relaxed">
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded transition"
      >
        {copied ? "✓ Copié" : "Copier"}
      </button>
      <pre className="whitespace-pre-wrap pr-20">{digest}</pre>
    </div>
  );
}
