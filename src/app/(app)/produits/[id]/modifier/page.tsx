import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { EditProductForm } from "./edit-product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params;
  const [product, categories, units, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id } }), prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }), prisma.unit.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }), prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  const values = { id: product.id, name: product.name, sku: product.sku, categoryId: product.categoryId, unitId: product.unitId, supplierId: product.supplierId ?? "", description: product.description ?? "", alertThreshold: product.alertThreshold.toString(), purchasePrice: product.purchasePriceMinor === null ? "" : (product.purchasePriceMinor / 100).toFixed(2), salePrice: product.salePriceMinor === null ? "" : (product.salePriceMinor / 100).toFixed(2) };
  return <div className="mx-auto max-w-4xl space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Catalogue</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Modifier {product.name}</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Le stock ne peut être corrigé que par une entrée, une sortie ou un ajustement.</p></header><section className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7"><EditProductForm product={values} categories={categories} units={units} suppliers={suppliers} /></section></div>;
}
