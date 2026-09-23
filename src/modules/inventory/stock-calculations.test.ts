import { describe, expect, it } from "vitest";
import { MovementType } from "@/generated/prisma/client";
import { calculateStockChange, StockError } from "./stock-calculations";

describe("calculateStockChange", () => {
  it("ajoute une entrée au stock", () => {
    const result = calculateStockChange({ type: MovementType.IN, stockBefore: 40, quantity: 25 });
    expect(result.stockAfter.toNumber()).toBe(65);
    expect(result.delta.toNumber()).toBe(25);
  });

  it("retire une sortie du stock", () => {
    const result = calculateStockChange({ type: MovementType.OUT, stockBefore: 65, quantity: 10 });
    expect(result.stockAfter.toNumber()).toBe(55);
    expect(result.delta.toNumber()).toBe(-10);
  });

  it("refuse une sortie supérieure au stock", () => {
    expect(() => calculateStockChange({ type: MovementType.OUT, stockBefore: 5, quantity: 6 })).toThrowError(new StockError("Stock insuffisant : 5 disponible."));
  });

  it("calcule un ajustement négatif après inventaire", () => {
    const result = calculateStockChange({ type: MovementType.ADJUSTMENT, stockBefore: 50, countedQuantity: 47 });
    expect(result.stockAfter.toNumber()).toBe(47);
    expect(result.delta.toNumber()).toBe(-3);
    expect(result.quantity.toNumber()).toBe(3);
  });

  it("refuse un ajustement sans différence", () => {
    expect(() => calculateStockChange({ type: MovementType.ADJUSTMENT, stockBefore: 50, countedQuantity: 50 })).toThrow("identique");
  });

  it("conserve les quantités décimales", () => {
    const result = calculateStockChange({ type: MovementType.IN, stockBefore: "1.250", quantity: 0.75 });
    expect(result.stockAfter.toFixed(3)).toBe("2.000");
  });
});
