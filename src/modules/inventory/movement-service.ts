import { MovementReason, MovementType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class StockError extends Error {}

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
    const rows = await tx.$queryRaw<Array<{ quantity: Prisma.Decimal }>>`
      SELECT quantity FROM inventories
      WHERE "productId" = ${input.productId}::uuid
      FOR UPDATE
    `;
    if (!rows[0]) throw new StockError("Inventaire introuvable pour ce produit.");

    const stockBefore = new Prisma.Decimal(rows[0].quantity);
    let delta: Prisma.Decimal;
    let stockAfter: Prisma.Decimal;

    if (input.type === MovementType.ADJUSTMENT) {
      if (input.countedQuantity === undefined) throw new StockError("La quantité comptée est obligatoire.");
      stockAfter = new Prisma.Decimal(input.countedQuantity.toString());
      delta = stockAfter.minus(stockBefore);
      if (delta.equals(0)) throw new StockError("Le stock compté est identique au stock actuel.");
    } else {
      if (!input.quantity || input.quantity <= 0) throw new StockError("La quantité doit être supérieure à zéro.");
      const absoluteQuantity = new Prisma.Decimal(input.quantity.toString());
      delta = input.type === MovementType.IN ? absoluteQuantity : absoluteQuantity.negated();
      stockAfter = stockBefore.plus(delta);
    }

    if (stockAfter.lessThan(0)) throw new StockError(`Stock insuffisant : ${stockBefore.toString()} disponible.`);

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
      quantity: delta.abs(),
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
