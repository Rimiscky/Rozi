"use client";

import { useActionState } from "react";
import { updateProduct, type ProductState } from "../../actions";

type Choice = { id: string; name: string };
type ProductValues = { id: string; name: string; sku: string; categoryId: string; unitId: string; supplierId: string; description: string; alertThreshold: string; purchasePrice: string; salePrice: string };
const input = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--brand)]";

export function EditProductForm({ product, categories, units, suppliers }: { product: ProductValues; categories: Choice[]; units: Choice[]; suppliers: Choice[] }) {
  const action = updateProduct.bind(null, product.id); const [state, formAction, pending] = useActionState(action, {} as ProductState); const value = (name: keyof ProductValues) => state.fields?.[name] ?? product[name];
  return <form action={formAction} className="space-y-6">{state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}<div className="grid gap-5 md:grid-cols-2">
    <Field label="Nom"><input name="name" defaultValue={value("name")} className={input} required /></Field><Field label="Référence / SKU"><input name="sku" defaultValue={value("sku")} className={input} required /></Field>
    <Field label="Catégorie"><select name="categoryId" defaultValue={value("categoryId")} className={input}>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field><Field label="Unité"><select name="unitId" defaultValue={value("unitId")} className={input}>{units.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Seuil d’alerte"><input name="alertThreshold" type="number" min="0" step="0.001" defaultValue={value("alertThreshold")} className={input} required /></Field><Field label="Fournisseur"><select name="supplierId" defaultValue={value("supplierId")} className={input}><option value="">Aucun</option>{suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Prix d’achat"><input name="purchasePrice" type="number" min="0" step="0.01" defaultValue={value("purchasePrice")} className={input} /></Field><Field label="Prix de vente"><input name="salePrice" type="number" min="0" step="0.01" defaultValue={value("salePrice")} className={input} /></Field>
  </div><Field label="Description"><textarea name="description" rows={4} defaultValue={value("description")} className={`${input} py-3`} /></Field><div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-end"><a href={`/produits/${product.id}`} className="grid min-h-12 place-items-center rounded-xl border border-[var(--line)] px-5 text-sm font-bold">Annuler</a><button disabled={pending} className="min-h-12 rounded-xl bg-[var(--brand)] px-6 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer"}</button></div></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-sm font-bold">{label}</span>{children}</label>; }
