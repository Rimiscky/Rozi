"use client";

import { useActionState } from "react";
import { createProduct, type ProductState } from "../actions";

type Choice = { id: string; name: string };
const input = "min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base outline-none focus:border-[var(--brand)]";
const label = "mb-2 block text-sm font-bold";

export function ProductForm({ categories, units, suppliers }: { categories: Choice[]; units: Choice[]; suppliers: Choice[] }) {
  const [state, action, pending] = useActionState(createProduct, {} as ProductState);
  return <form action={action} className="space-y-6">
    {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p> : null}
    <div className="grid gap-5 md:grid-cols-2">
      <Field title="Nom du produit"><input name="name" defaultValue={state.fields?.name} className={input} placeholder="Ex. Ciment 50 kg" required /></Field>
      <Field title="Référence / SKU"><input name="sku" defaultValue={state.fields?.sku} className={input} placeholder="Ex. CIM-50" required /></Field>
      <Field title="Catégorie"><select name="categoryId" defaultValue={state.fields?.categoryId ?? ""} className={input} required><option value="" disabled>Choisir une catégorie</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field title="Unité"><select name="unitId" defaultValue={state.fields?.unitId ?? ""} className={input} required><option value="" disabled>Choisir une unité</option>{units.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field title="Stock initial"><input name="initialStock" type="number" step="0.001" min="0" defaultValue={state.fields?.initialStock ?? "0"} className={input} required /></Field>
      <Field title="Seuil d’alerte"><input name="alertThreshold" type="number" step="0.001" min="0" defaultValue={state.fields?.alertThreshold ?? "0"} className={input} required /></Field>
      <Field title="Prix d’achat (facultatif)"><input name="purchasePrice" type="number" step="0.01" min="0" defaultValue={state.fields?.purchasePrice} className={input} placeholder="0,00" /></Field>
      <Field title="Prix de vente (facultatif)"><input name="salePrice" type="number" step="0.01" min="0" defaultValue={state.fields?.salePrice} className={input} placeholder="0,00" /></Field>
      <Field title="Fournisseur principal (facultatif)"><select name="supplierId" defaultValue={state.fields?.supplierId ?? ""} className={input}><option value="">Aucun fournisseur</option>{suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    </div>
    <Field title="Description (facultative)"><textarea name="description" defaultValue={state.fields?.description} rows={4} className={`${input} py-3`} placeholder="Informations utiles sur le produit" /></Field>
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-end"><a href="/produits" className="grid min-h-12 place-items-center rounded-xl border border-[var(--line)] px-5 text-sm font-bold">Annuler</a><button disabled={pending} className="min-h-12 rounded-xl bg-[var(--brand)] px-6 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Création…" : "Créer le produit"}</button></div>
  </form>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label><span className={label}>{title}</span>{children}</label>; }
