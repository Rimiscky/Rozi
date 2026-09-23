import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { ProductForm } from "./product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, units, suppliers] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return <div className="mx-auto max-w-4xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Catalogue</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Nouveau produit</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Le stock initial sera enregistré automatiquement dans l’historique.</p></header><section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7"><ProductForm categories={categories} units={units} suppliers={suppliers} /></section></div>;
}
