"use client";

import { useActionState } from "react";
import { createCategory, createSupplier, createUnit, type SettingsState } from "./actions";

const initialState: SettingsState = {};
const inputClass = "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--brand)]";

function Feedback({ state }: { state: SettingsState }) {
  if (state.error) return <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.success) return <p className="text-sm font-semibold text-emerald-700">{state.success}</p>;
  return null;
}

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, initialState);
  return <form action={action} className="space-y-3">
    <input name="name" className={inputClass} placeholder="Ex. Jardinage" required minLength={2} />
    <Feedback state={state} />
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white disabled:opacity-60">Ajouter la catégorie</button>
  </form>;
}

export function UnitForm() {
  const [state, action, pending] = useActionState(createUnit, initialState);
  return <form action={action} className="space-y-3">
    <div className="grid grid-cols-[1fr_6rem] gap-2">
      <input name="name" className={inputClass} placeholder="Ex. palette" required />
      <input name="symbol" className={inputClass} placeholder="pal" required />
    </div>
    <select name="decimals" className={inputClass} defaultValue="0"><option value="0">Entier</option><option value="1">1 décimale</option><option value="2">2 décimales</option><option value="3">3 décimales</option></select>
    <Feedback state={state} />
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white disabled:opacity-60">Ajouter l’unité</button>
  </form>;
}

export function SupplierForm() {
  const [state, action, pending] = useActionState(createSupplier, initialState);
  return <form action={action} className="space-y-3">
    <input name="name" className={inputClass} placeholder="Nom du fournisseur" required />
    <div className="grid gap-2 sm:grid-cols-2"><input name="phone" className={inputClass} placeholder="Téléphone (facultatif)" /><input name="email" type="email" className={inputClass} placeholder="E-mail (facultatif)" /></div>
    <Feedback state={state} />
    <button disabled={pending} className="min-h-11 w-full rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white disabled:opacity-60">Ajouter le fournisseur</button>
  </form>;
}
