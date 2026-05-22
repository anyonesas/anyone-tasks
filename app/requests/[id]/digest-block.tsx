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
    <div className="relative bg-zinc-900 text-zinc-100 rounded-2xl overflow-hidden">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={copy}
          className="text-xs bg-white/10 hover:bg-white/20 text-zinc-100 px-3 py-1.5 rounded-lg backdrop-blur transition font-medium"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap p-5 pr-24 font-mono text-xs leading-relaxed overflow-x-auto">
        {digest}
      </pre>
    </div>
  );
}
