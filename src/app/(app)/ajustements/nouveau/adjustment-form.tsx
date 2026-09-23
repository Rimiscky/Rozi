"use client";

import { useActionState } from "react";
import { createAdjustment, type AdjustmentState } from "./actions";

type Product = { id: string; name: string; sku: string; unitSymbol: string; quantity: string };
const field = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--brand)]";

export function AdjustmentForm({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState(createAdjustment, {} as AdjustmentState);
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return <form action={action} className="space-y-5">
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}
    <Label text="Produit"><select name="productId" className={field} required defaultValue=""><option value="" disabled>Choisir un produit</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} — stock système : {p.quantity} {p.unitSymbol}</option>)}</select></Label>
    <div className="grid gap-5 sm:grid-cols-2"><Label text="Quantité réellement comptée"><input name="countedQuantity" type="number" min="0" step="0.001" className={field} required /></Label><Label text="Date de l’inventaire"><input name="occurredAt" type="datetime-local" defaultValue={now.toISOString().slice(0,16)} className={field} required /></Label></div>
    <Label text="Motif de la correction"><textarea name="comment" minLength={5} maxLength={500} rows={4} className={`${field} py-3`} placeholder="Ex. Correction après inventaire physique" required /></Label>
    <button disabled={pending || !products.length} className="min-h-12 w-full rounded-xl bg-[var(--brand)] px-6 text-base font-extrabold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Valider l’ajustement"}</button>
  </form>;
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{text}</span>{children}</label>; }
