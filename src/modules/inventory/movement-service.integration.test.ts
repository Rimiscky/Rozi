import { beforeAll, describe, expect, it } from "vitest";
import { MovementReason, MovementType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordStockMovement } from "./movement-service";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error("DATABASE_URL_TEST est obligatoire pour les tests d’intégration.");
if (process.env.DATABASE_URL !== databaseUrl) throw new Error("DATABASE_URL doit pointer vers DATABASE_URL_TEST pendant cette suite.");

let userId: string;
let categoryId: string;
let unitId: string;
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

beforeAll(async () => {
  const user = await prisma.user.create({ data: { username: `integration-${suffix}`, name: "Test intégration", passwordHash: "not-a-real-login-hash", role: "ADMIN" } });
  const category = await prisma.category.create({ data: { name: `Catégorie ${suffix}` } });
  const unit = await prisma.unit.create({ data: { name: `Unité ${suffix}`, symbol: "tst", decimals: 0 } });
  userId = user.id; categoryId = category.id; unitId = unit.id;
});

async function createProduct(initialStock: number) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { name: `Produit ${randomName()}`, sku: `SKU-${randomName()}`, categoryId, unitId, createdById: userId, inventory: { create: { quantity: initialStock } } } });
    if (initialStock > 0) await tx.stockMovement.create({ data: { productId: product.id, userId, type: MovementType.IN, reason: MovementReason.INITIAL_STOCK, quantity: initialStock, delta: initialStock, stockBefore: 0, stockAfter: initialStock, occurredAt: new Date() } });
    return product;
  });
}

function randomName() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

async function assertLedger(productId: string, expected: number) {
  const [inventory, movements] = await Promise.all([
    prisma.inventory.findUniqueOrThrow({ where: { productId } }),
    prisma.stockMovement.findMany({ where: { productId }, select: { delta: true } }),
  ]);
  expect(Number(inventory.quantity)).toBe(expected);
  expect(movements.reduce((sum, movement) => sum + Number(movement.delta), 0)).toBe(expected);
}

describe("concurrence des mouvements PostgreSQL", () => {
  it("refuse une des deux sorties quand le stock ne couvre pas les deux", async () => {
    const product = await createProduct(10);
    const results = await Promise.allSettled([1, 2].map(() => recordStockMovement({ productId: product.id, userId, type: MovementType.OUT, reason: MovementReason.SALE, quantity: 7, occurredAt: new Date() })));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    await assertLedger(product.id, 3);
  });

  it("conserve exactement vingt entrées simultanées", async () => {
    const product = await createProduct(0);
    await Promise.all(Array.from({ length: 20 }, () => recordStockMovement({ productId: product.id, userId, type: MovementType.IN, reason: MovementReason.PURCHASE, quantity: 1, occurredAt: new Date() })));
    await assertLedger(product.id, 20);
    expect(await prisma.stockMovement.count({ where: { productId: product.id } })).toBe(20);
  });
});
