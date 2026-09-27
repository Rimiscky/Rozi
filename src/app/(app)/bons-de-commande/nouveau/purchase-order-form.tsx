"use client";

import { useActionState, useState } from "react";
import { createPurchaseOrder, type PurchaseOrderState } from "../actions";

type Product = { id: string; name: string; sku: string; unit: string };
type Supplier = { id: string; code: string; name: string };
const field = "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm";

export function PurchaseOrderForm({ products, suppliers }: { products: Product[]; suppliers: Supplier[] }) {
  const [state, action, pending] = useActionState(createPurchaseOrder, {} as PurchaseOrderState);
  const [rows, setRows] = useState([0]);
  return <form action={action} className="space-y-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{state.error}</p> : null}
    <label className="block"><span className="mb-2 block text-sm font-bold">Fournisseur</span><select name="supplierId" className={field} required><option value="">Choisir</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} · {supplier.name}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold">Livraison prévue</span><input name="expectedAt" type="date" className={field} /></label><label className="block"><span className="mb-2 block text-sm font-bold">Note</span><input name="notes" maxLength={1000} className={field} /></label></div>
    <fieldset className="space-y-3"><legend className="text-sm font-extrabold">Produits commandés</legend>{rows.map((key, index) => <div key={key} className="grid gap-2 rounded-xl bg-[var(--canvas)] p-3 sm:grid-cols-[1fr_8rem_8rem_auto]"><select name="productId" className={field} required><option value="">Produit</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku} ({product.unit})</option>)}</select><input name="quantity" type="number" min="0.001" step="0.001" placeholder="Quantité" className={field} required /><input name="unitPrice" type="number" min="0" step="0.01" placeholder="Prix unitaire" className={field} /><button type="button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} disabled={rows.length === 1} className="min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm font-bold disabled:opacity-40">Retirer</button></div>)}</fieldset>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setRows((current) => [...current, Math.max(...current) + 1])} className="min-h-11 rounded-xl border border-[var(--line)] px-4 text-sm font-bold">Ajouter une ligne</button><button disabled={pending || !products.length || !suppliers.length} className="min-h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Création…" : "Créer le bon"}</button></div>
  </form>;
}
