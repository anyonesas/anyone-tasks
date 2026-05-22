import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "not_allowed"
      ? "Ton compte n'est pas autorisé sur ce dashboard."
      : params.error === "callback_failed"
        ? "Lien magique invalide ou expiré."
        : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative cards in background */}
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-3xl bg-amber-200 rotate-[-8deg] opacity-60 blur-sm" />
      <div className="absolute top-1/3 -right-16 w-72 h-72 rounded-3xl bg-violet-200 rotate-[10deg] opacity-60 blur-sm" />
      <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-3xl bg-lime-200 rotate-[5deg] opacity-60 blur-sm" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-semibold tracking-tight text-zinc-900">
            anyone tasks
          </h1>
          <p className="mt-3 text-zinc-500">
            Demandes au dev principal.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-zinc-200/70 shadow-xl shadow-zinc-900/[0.04] p-8 md:p-10">
          <LoginForm initialError={initialError} />
        </div>
      </div>
    </div>
  );
}
