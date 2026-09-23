import { MovementType, Prisma } from "@/generated/prisma/client";

export class StockError extends Error {}

export function calculateStockChange(input: {
  type: MovementType;
  stockBefore: Prisma.Decimal | number | string;
  quantity?: number;
  countedQuantity?: number;
}) {
  const stockBefore = new Prisma.Decimal(input.stockBefore);
  let delta: Prisma.Decimal;
  let stockAfter: Prisma.Decimal;

  if (input.type === MovementType.ADJUSTMENT) {
    if (input.countedQuantity === undefined || input.countedQuantity < 0) throw new StockError("La quantité comptée est obligatoire.");
    stockAfter = new Prisma.Decimal(input.countedQuantity.toString());
    delta = stockAfter.minus(stockBefore);
    if (delta.equals(0)) throw new StockError("Le stock compté est identique au stock actuel.");
  } else {
    if (!input.quantity || input.quantity <= 0) throw new StockError("La quantité doit être supérieure à zéro.");
    const quantity = new Prisma.Decimal(input.quantity.toString());
    delta = input.type === MovementType.IN ? quantity : quantity.negated();
    stockAfter = stockBefore.plus(delta);
  }

  if (stockAfter.lessThan(0)) throw new StockError(`Stock insuffisant : ${stockBefore.toString()} disponible.`);
  return { stockBefore, stockAfter, delta, quantity: delta.abs() };
}
