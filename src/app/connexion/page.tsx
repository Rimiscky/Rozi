import { CheckCircle2, ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-[var(--ink)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand)] text-xl font-extrabold">R</span>
          <span className="text-2xl font-extrabold tracking-tight">Rozi</span>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-300">Votre stock, simplement</p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">Chaque article compté.<br />Chaque mouvement conservé.</h1>
          <div className="mt-10 grid gap-4 text-sm text-white/75 sm:grid-cols-2">
            <p className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={20} /> Stock calculé automatiquement</p>
            <p className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={20} /> Historique complet</p>
          </div>
        </div>

        <p className="text-sm text-white/45">Application privée de gestion de quincaillerie</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand)] text-xl font-extrabold text-white">R</span>
            <span className="text-2xl font-extrabold tracking-tight">Rozi</span>
          </div>

          <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_60px_rgba(16,42,34,.08)] sm:p-9">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand-pale)] text-[var(--brand-dark)]"><ShieldCheck size={22} /></span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Bienvenue sur Rozi</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Connectez-vous avec l’identifiant fourni par votre administrateur.</p>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">Accès réservé au personnel autorisé.</p>
        </div>
      </section>
    </main>
  );
}
