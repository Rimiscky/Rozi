"use client";

import { useActionState } from "react";
import { createExit, type ExitState } from "./actions";

type Product = { id: string; name: string; sku: string; unitSymbol: string; quantity: string };
const field = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--brand)]";

export function ExitForm({ products, selectedProduct }: { products: Product[]; selectedProduct?: string }) {
  const [state, action, pending] = useActionState(createExit, {} as ExitState);
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return <form action={action} className="space-y-5">
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}
    <Label text="Produit"><select name="productId" defaultValue={selectedProduct ?? ""} className={field} required><option value="" disabled>Choisir un produit</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.sku} (disponible : {p.quantity} {p.unitSymbol})</option>)}</select></Label>
    <div className="grid gap-5 sm:grid-cols-2"><Label text="Quantité sortie"><input name="quantity" type="number" min="0.001" step="0.001" className={field} required /></Label><Label text="Date et heure"><input name="occurredAt" type="datetime-local" defaultValue={now.toISOString().slice(0,16)} className={field} required /></Label></div>
    <Label text="Motif"><select name="reason" className={field} required><option value="SALE">Vente</option><option value="INTERNAL_USE">Utilisation interne</option><option value="DAMAGED">Produit endommagé</option><option value="LOSS">Perte</option><option value="SUPPLIER_RETURN">Retour fournisseur</option><option value="OTHER">Autre</option></select></Label>
    <Label text="Client (facultatif)"><input name="customerName" className={field} maxLength={160} /></Label>
    <Label text="Référence (facultative)"><input name="reference" className={field} maxLength={120} /></Label>
    <Label text="Commentaire (facultatif)"><textarea name="comment" className={`${field} py-3`} rows={3} /></Label>
    <button disabled={pending || !products.length} className="min-h-12 w-full rounded-xl bg-[var(--brand)] px-6 text-base font-extrabold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Valider la sortie"}</button>
  </form>;
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{text}</span>{children}</label>; }
