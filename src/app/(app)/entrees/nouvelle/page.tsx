import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { EntryForm } from "./entry-form";

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  await requireUser(); const { produit } = await searchParams;
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, unit: { select: { symbol: true } }, inventory: { select: { quantity: true } } }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const formProducts = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unitSymbol: p.unit.symbol, quantity: p.inventory?.quantity.toString() ?? "0" }));
  return <div className="mx-auto max-w-2xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Mouvement de stock</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Nouvelle entrée</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">La quantité sera ajoutée automatiquement au stock actuel.</p></header><section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7"><EntryForm products={formProducts} suppliers={suppliers} selectedProduct={produit} /></section></div>;
}
