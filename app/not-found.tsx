import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Introuvable</h1>
        <p className="text-zinc-500 mt-2 text-sm">Cette page ou cette demande n'existe pas.</p>
        <Link href="/" className="inline-block mt-6 text-sm text-zinc-900 underline">
          Retour aux demandes
        </Link>
      </div>
    </div>
  );
}
