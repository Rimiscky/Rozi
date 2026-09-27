"use client";

import { useActionState } from "react";
import { importProducts, type ImportState } from "./actions";

const initialState: ImportState = {};

export function ImportForm() {
  const [state, action, pending] = useActionState(importProducts, initialState);
  return <form action={action} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
    <div><label htmlFor="catalogue" className="text-sm font-extrabold">Catalogue CSV</label><p className="mt-1 text-xs text-[var(--ink-soft)]">UTF-8, séparateur point-virgule, 5 Mio et 5 000 lignes maximum.</p></div>
    <input id="catalogue" name="file" type="file" accept=".csv,text/csv" required className="block min-h-12 w-full rounded-xl border border-[var(--line)] p-3 text-sm" />
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{state.error}</p> : null}
    {state.success ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{state.success}</p> : null}
    <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Import en cours…" : "Importer les produits"}</button>
  </form>;
}
