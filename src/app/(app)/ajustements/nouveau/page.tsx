import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { AdjustmentForm } from "./adjustment-form";

export default async function AdjustmentPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, unit: { select: { symbol: true } }, inventory: { select: { quantity: true } } }, orderBy: { name: "asc" } });
  const formProducts = products.map(p => ({ id: p.id, name: p.name, sku: p.sku, unitSymbol: p.unit.symbol, quantity: p.inventory?.quantity.toString() ?? "0" }));
  return <div className="mx-auto max-w-2xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Inventaire physique</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Ajuster le stock</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Saisissez la quantité réellement comptée. L’écart sera conservé dans l’historique.</p></header><aside className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Un ajustement ne supprime aucun ancien mouvement et ne peut pas être silencieux.</aside><section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7"><AdjustmentForm products={formProducts} /></section></div>;
}
