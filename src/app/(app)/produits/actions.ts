"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { MovementReason, MovementType, Prisma } from "@/generated/prisma/client";

export type ProductState = { error?: string; fields?: Record<string, string> };

const optionalId = z.preprocess((v) => v === "" ? undefined : v, z.string().uuid().optional());
const optionalPrice = z.preprocess((v) => v === "" ? undefined : v, z.coerce.number().min(0).optional());
const schema = z.object({
  name: z.string().trim().min(2).max(180),
  sku: z.string().trim().min(2).max(80),
  categoryId: z.string().uuid(),
  unitId: z.string().uuid(),
  supplierId: optionalId,
  description: z.preprocess((v) => v === "" ? undefined : v, z.string().trim().max(2000).optional()),
  alertThreshold: z.coerce.number().min(0).max(999999999),
  initialStock: z.coerce.number().min(0).max(999999999),
  purchasePrice: optionalPrice,
  salePrice: optionalPrice,
});

export async function createProduct(_: ProductState, formData: FormData): Promise<ProductState> {
  const user = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw as Record<string, string> };

  const data = parsed.data;
  const initialStock = new Prisma.Decimal(data.initialStock.toString());
  let productId: string;

  try {
    productId = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku.toUpperCase(),
          categoryId: data.categoryId,
          unitId: data.unitId,
          supplierId: data.supplierId,
          description: data.description,
          alertThreshold: new Prisma.Decimal(data.alertThreshold.toString()),
          purchasePriceMinor: data.purchasePrice === undefined ? undefined : Math.round(data.purchasePrice * 100),
          salePriceMinor: data.salePrice === undefined ? undefined : Math.round(data.salePrice * 100),
          createdById: user.id,
          inventory: { create: { quantity: initialStock } },
        },
      });

      if (initialStock.greaterThan(0)) {
        await tx.stockMovement.create({ data: {
          productId: product.id,
          userId: user.id,
          type: MovementType.IN,
          reason: MovementReason.INITIAL_STOCK,
          quantity: initialStock,
          delta: initialStock,
          stockBefore: 0,
          stockAfter: initialStock,
          occurredAt: new Date(),
          comment: "Stock initial",
        } });
      }
      await tx.auditLog.create({ data: { userId: user.id, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id } });
      return product.id;
    });
  } catch {
    return { error: "Impossible de créer le produit. Vérifiez que la référence n’existe pas déjà.", fields: raw as Record<string, string> };
  }

  redirect(`/produits/${productId}`);
}

const updateSchema = schema.omit({ initialStock: true });

export async function updateProduct(productId: string, _: ProductState, formData: FormData): Promise<ProductState> {
  const user = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw as Record<string, string> };
  const data = parsed.data;
  try {
    await prisma.$transaction([
      prisma.product.update({ where: { id: productId }, data: {
        name: data.name, sku: data.sku.toUpperCase(), categoryId: data.categoryId, unitId: data.unitId,
        supplierId: data.supplierId ?? null, description: data.description ?? null,
        alertThreshold: new Prisma.Decimal(data.alertThreshold.toString()),
        purchasePriceMinor: data.purchasePrice === undefined ? null : Math.round(data.purchasePrice * 100),
        salePriceMinor: data.salePrice === undefined ? null : Math.round(data.salePrice * 100),
      } }),
      prisma.auditLog.create({ data: { userId: user.id, action: "PRODUCT_UPDATED", entityType: "Product", entityId: productId } }),
    ]);
  } catch {
    return { error: "Modification impossible. Vérifiez notamment que la référence est unique.", fields: raw as Record<string, string> };
  }
  revalidatePath(`/produits/${productId}`); revalidatePath("/produits");
  redirect(`/produits/${productId}`);
}

export async function toggleProductStatus(formData: FormData) {
  const user = await requireAdmin();
  const productId = z.string().uuid().parse(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { inventory: true } });
  if (!product) return;
  if (product.isActive && Number(product.inventory?.quantity ?? 0) > 0) return;
  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { isActive: !product.isActive } }),
    prisma.auditLog.create({ data: { userId: user.id, action: product.isActive ? "PRODUCT_ARCHIVED" : "PRODUCT_REACTIVATED", entityType: "Product", entityId: productId } }),
  ]);
  revalidatePath(`/produits/${productId}`); revalidatePath("/produits");
}
