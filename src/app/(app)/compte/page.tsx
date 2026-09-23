import { requireUser } from "@/lib/permissions";
import { PasswordForm } from "./password-form";

export default async function AccountPage() {
  const user = await requireUser();
  return <div className="mx-auto max-w-xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Compte personnel</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">{user.name}</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">@{user.username} · {user.role === "ADMIN" ? "Administrateur" : "Employé"}</p></header><section className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7"><h2 className="text-lg font-extrabold">Changer le mot de passe</h2><p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">Utilisez au minimum 12 caractères.</p><PasswordForm /></section></div>;
}
