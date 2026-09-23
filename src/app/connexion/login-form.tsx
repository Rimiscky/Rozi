"use client";

import { useActionState } from "react";
import { Eye, LockKeyhole, UserRound } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-bold text-[var(--ink)]">Identifiant</label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={19} aria-hidden="true" />
          <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" required minLength={2} maxLength={80} className="min-h-13 w-full rounded-xl border border-[var(--line)] bg-white pl-12 pr-4 text-base outline-none transition focus:border-[var(--brand)]" placeholder="Votre identifiant" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-bold text-[var(--ink)]">Mot de passe</label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={19} aria-hidden="true" />
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={128} className="min-h-13 w-full rounded-xl border border-[var(--line)] bg-white pl-12 pr-12 text-base outline-none transition focus:border-[var(--brand)]" placeholder="Votre mot de passe" />
          <Eye className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={19} aria-hidden="true" />
        </div>
      </div>

      {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}

      <button type="submit" disabled={isPending} className="min-h-13 w-full rounded-xl bg-[var(--brand)] px-5 text-base font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[var(--brand-dark)] disabled:cursor-wait disabled:opacity-65">
        {isPending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
