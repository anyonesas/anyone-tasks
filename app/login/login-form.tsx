"use client";

import { useActionState } from "react";
import { signInWithMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState(signInWithMagicLink, initialState);
  const error = state.status === "error" ? state.message : initialError;

  if (state.status === "sent") {
    return (
      <div className="text-center py-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight">Lien envoyé</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Va vérifier ta boîte mail<br />
          (<b>{state.email}</b>)
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">
          Ton email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="toi@anyone.fr"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
        />
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {pending ? "Envoi…" : "Recevoir un lien magique →"}
      </button>
    </form>
  );
}
