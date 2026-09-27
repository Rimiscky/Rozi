"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MovementReason, MovementType, Prisma, PurchaseOrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { recordStockMovementTx } from "@/modules/inventory/movement-service";

export type PurchaseOrderState = { error?: string };

export async function createPurchaseOrder(_: PurchaseOrderState, formData: FormData): Promise<PurchaseOrderState> {
  const admin = await requireAdmin();
  const supplierId = z.string().uuid().safeParse(formData.get("supplierId"));
  const expectedAtRaw = String(formData.get("expectedAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const prices = formData.getAll("unitPrice").map(String);
  if (!supplierId.success) return { error: "Sélectionnez un fournisseur." };
  if (!productIds.length || productIds.length !== quantities.length) return { error: "Ajoutez au moins une ligne valide." };
  if (new Set(productIds).size !== productIds.length) return { error: "Un produit ne peut apparaître qu’une fois par bon." };

  const lineSchema = z.object({ productId: z.string().uuid(), quantity: z.coerce.number().positive().max(999_999_999), unitPrice: z.union([z.literal(""), z.coerce.number().min(0).max(9_999_999)]) });
  const parsedLines = productIds.map((productId, index) => lineSchema.safeParse({ productId, quantity: quantities[index], unitPrice: prices[index] ?? "" }));
  const invalid = parsedLines.find((result) => !result.success);
  if (invalid && !invalid.success) return { error: invalid.error.issues[0].message };
  const lines = parsedLines.map((result) => result.success ? result.data : neverResult());

  const [supplier, products] = await Promise.all([
    prisma.supplier.findFirst({ where: { id: supplierId.data, isActive: true } }),
    prisma.product.findMany({ where: { id: { in: productIds }, isActive: true }, include: { unit: true } }),
  ]);
  if (!supplier) return { error: "Ce fournisseur est introuvable ou inactif." };
  if (products.length !== productIds.length) return { error: "Un produit est introuvable ou archivé." };

  const number = `BC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.purchaseOrder.create({ data: {
      number,
      supplierId: supplier.id,
      status: PurchaseOrderStatus.ORDERED,
      orderedAt: new Date(),
      expectedAt: expectedAtRaw ? new Date(`${expectedAtRaw}T12:00:00`) : null,
      notes: notes || null,
      createdById: admin.id,
      lines: { create: lines.map((line, index) => {
        const product = products.find((item) => item.id === line.productId)!;
        return { position: index + 1, productId: product.id, quantity: new Prisma.Decimal(line.quantity.toString()), unitPriceMinor: line.unitPrice === "" ? null : Math.round(line.unitPrice * 100), productSkuSnapshot: product.sku, productNameSnapshot: product.name, unitSymbolSnapshot: product.unit.symbol };
      }) },
    } });
    await tx.auditLog.create({ data: { userId: admin.id, action: "PURCHASE_ORDER_CREATED", entityType: "PurchaseOrder", entityId: created.id, metadata: { number, lineCount: lines.length } } });
    return created;
  });
  redirect(`/bons-de-commande/${order.id}`);
}

function neverResult(): never { throw new Error("Ligne invalide."); }

export async function receivePurchaseOrder(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = z.string().uuid().parse(formData.get("orderId"));
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; status: PurchaseOrderStatus; supplierId: string; number: string }>>`
      SELECT id, status, "supplierId", number FROM purchase_orders WHERE id = ${orderId}::uuid FOR UPDATE
    `;
    const order = rows[0];
    if (!order || order.status !== PurchaseOrderStatus.ORDERED) throw new Error("Ce bon ne peut pas être réceptionné.");
    const lines = await tx.purchaseOrderLine.findMany({ where: { purchaseOrderId: orderId }, orderBy: { productId: "asc" } });
    for (const line of lines) {
      const remaining = line.quantity.minus(line.receivedQuantity);
      if (remaining.lessThanOrEqualTo(0)) continue;
      await recordStockMovementTx(tx, { productId: line.productId, userId: admin.id, supplierId: order.supplierId, purchaseOrderLineId: line.id, type: MovementType.IN, reason: MovementReason.PURCHASE, quantity: remaining.toNumber(), reference: order.number, comment: "Réception d’un bon de commande", occurredAt: new Date() });
      await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQuantity: line.quantity } });
    }
    await tx.purchaseOrder.update({ where: { id: orderId }, data: { status: PurchaseOrderStatus.RECEIVED } });
    await tx.auditLog.create({ data: { userId: admin.id, action: "PURCHASE_ORDER_RECEIVED", entityType: "PurchaseOrder", entityId: orderId, metadata: { number: order.number } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath(`/bons-de-commande/${orderId}`); revalidatePath("/bons-de-commande"); revalidatePath("/tableau-de-bord");
}
