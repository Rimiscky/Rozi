"use client";

import { useActionState } from "react";
import { createUser, type UserState } from "./actions";

const field = "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--brand)]";

export function UserForm() {
  const [state, action, pending] = useActionState(createUser, {} as UserState);
  return <form action={action} className="space-y-3">
    <input name="name" className={field} placeholder="Nom complet" required />
    <input name="username" className={field} placeholder="Identifiant de connexion" autoCapitalize="none" required />
    <input name="password" type="password" className={field} placeholder="Mot de passe — 12 caractères minimum" minLength={12} required />
    <select name="role" className={field} defaultValue="EMPLOYEE"><option value="EMPLOYEE">Employé</option><option value="ADMIN">Administrateur</option></select>
    {state.error ? <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p> : null}{state.success ? <p className="text-sm font-semibold text-emerald-700">{state.success}</p> : null}
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Création…" : "Créer le compte"}</button>
  </form>;
}
