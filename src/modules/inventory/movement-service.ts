import { MovementReason, MovementType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateStockChange, StockError } from "./stock-calculations";

export { StockError } from "./stock-calculations";

type MovementInput = {
  productId: string;
  userId: string;
  type: MovementType;
  reason: MovementReason;
  quantity?: number;
  countedQuantity?: number;
  supplierId?: string;
  customerName?: string;
  reference?: string;
  comment?: string;
  occurredAt: Date;
};

export async function recordStockMovement(input: MovementInput) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ quantity: Prisma.Decimal; isActive: boolean }>>`
      SELECT i.quantity, p."isActive" FROM inventories i
      INNER JOIN products p ON p.id = i."productId"
      WHERE i."productId" = ${input.productId}::uuid
      FOR UPDATE
    `;
    if (!rows[0]) throw new StockError("Inventaire introuvable pour ce produit.");
    if (!rows[0].isActive) throw new StockError("Ce produit est archivé et ne peut plus recevoir de mouvement.");

    const { stockBefore, stockAfter, delta, quantity } = calculateStockChange({
      type: input.type,
      stockBefore: rows[0].quantity,
      quantity: input.quantity,
      countedQuantity: input.countedQuantity,
    });

    await tx.inventory.update({
      where: { productId: input.productId },
      data: { quantity: stockAfter, version: { increment: 1 } },
    });

    return tx.stockMovement.create({ data: {
      productId: input.productId,
      userId: input.userId,
      supplierId: input.supplierId,
      type: input.type,
      reason: input.reason,
      quantity,
      delta,
      stockBefore,
      stockAfter,
      reference: input.reference,
      customerName: input.customerName,
      comment: input.comment,
      occurredAt: input.occurredAt,
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
