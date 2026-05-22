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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            anyone tasks
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Demandes de modif & questions au dev principal.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <LoginForm initialError={initialError} />
        </div>
      </div>
    </div>
  );
}
