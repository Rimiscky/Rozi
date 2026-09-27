import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { PurchaseOrderForm } from "./purchase-order-form";

export default async function NewPurchaseOrderPage() {
  await requireAdmin();
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { unit: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  return <div className="space-y-6"><header><p className="text-sm font-bold text-[var(--brand)]">Approvisionnement</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Nouveau bon de commande</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Le stock ne change qu’au moment de la réception.</p></header><PurchaseOrderForm products={products.map((product) => ({ id: product.id, name: product.name, sku: product.sku, unit: product.unit.symbol }))} suppliers={suppliers.map((supplier) => ({ id: supplier.id, code: supplier.code, name: supplier.name }))} /></div>;
}
