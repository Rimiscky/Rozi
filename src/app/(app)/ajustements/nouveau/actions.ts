"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MovementReason, MovementType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { recordStockMovement, StockError } from "@/modules/inventory/movement-service";

export type AdjustmentState = { error?: string };

export async function createAdjustment(_: AdjustmentState, formData: FormData): Promise<AdjustmentState> {
  const user = await requireAdmin();
  const parsed = z.object({
    productId: z.string().uuid(), countedQuantity: z.coerce.number().min(0).max(999999999),
    comment: z.string().trim().min(5, "Expliquez la raison de la correction.").max(500), occurredAt: z.coerce.date(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await recordStockMovement({ ...parsed.data, userId: user.id, type: MovementType.ADJUSTMENT, reason: MovementReason.INVENTORY_CORRECTION });
  } catch (error) {
    return { error: error instanceof StockError ? error.message : "L’ajustement n’a pas pu être enregistré." };
  }
  redirect(`/produits/${parsed.data.productId}`);
}
