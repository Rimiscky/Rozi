"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MovementReason, MovementType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/permissions";
import { recordStockMovement, StockError } from "@/modules/inventory/movement-service";

export type ExitState = { error?: string };
const reasonMap = { SALE: MovementReason.SALE, INTERNAL_USE: MovementReason.INTERNAL_USE, DAMAGED: MovementReason.DAMAGED, LOSS: MovementReason.LOSS, SUPPLIER_RETURN: MovementReason.SUPPLIER_RETURN, OTHER: MovementReason.OTHER };
const optional = z.preprocess(v => v === "" ? undefined : v, z.string().trim().max(500).optional());

export async function createExit(_: ExitState, formData: FormData): Promise<ExitState> {
  const user = await requireUser();
  const parsed = z.object({
    productId: z.string().uuid(), quantity: z.coerce.number().positive().max(999999999),
    reason: z.enum(["SALE", "INTERNAL_USE", "DAMAGED", "LOSS", "SUPPLIER_RETURN", "OTHER"]),
    customerName: optional, reference: optional, comment: optional, occurredAt: z.coerce.date(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await recordStockMovement({ ...parsed.data, reason: reasonMap[parsed.data.reason], userId: user.id, type: MovementType.OUT });
  } catch (error) {
    return { error: error instanceof StockError ? error.message : "La sortie n’a pas pu être enregistrée." };
  }
  redirect(`/produits/${parsed.data.productId}`);
}
