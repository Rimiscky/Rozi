import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { ExitForm } from "./exit-form";

export default async function NewExitPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  await requireUser(); const { produit } = await searchParams;
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, unit: { select: { symbol: true } }, inventory: { select: { quantity: true } } }, orderBy: { name: "asc" } });
  const formProducts = products.map(p => ({ id: p.id, name: p.name, sku: p.sku, unitSymbol: p.unit.symbol, quantity: p.inventory?.quantity.toString() ?? "0" }));
  return <div className="mx-auto max-w-2xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Mouvement de stock</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Nouvelle sortie</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Une sortie supérieure au stock disponible sera automatiquement refusée.</p></header><section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7"><ExitForm products={formProducts} selectedProduct={produit} /></section></div>;
}
