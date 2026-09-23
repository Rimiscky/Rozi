"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

const field = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--brand)]";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as PasswordState);
  return <form action={action} className="space-y-4"><Label text="Mot de passe actuel"><input name="currentPassword" type="password" autoComplete="current-password" className={field} required /></Label><Label text="Nouveau mot de passe"><input name="newPassword" type="password" autoComplete="new-password" minLength={12} className={field} required /></Label><Label text="Confirmer le nouveau mot de passe"><input name="confirmation" type="password" autoComplete="new-password" minLength={12} className={field} required /></Label>{state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}{state.success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{state.success}</p> : null}<button disabled={pending} className="min-h-12 w-full rounded-xl bg-[var(--brand)] px-5 font-extrabold text-white disabled:opacity-60">{pending ? "Modification…" : "Modifier le mot de passe"}</button></form>;
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{text}</span>{children}</label>; }
