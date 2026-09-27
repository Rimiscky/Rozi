"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { wholeQuantity } from "@/lib/quantity";
import { MovementReason, MovementType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/permissions";
import { recordStockMovement, StockError } from "@/modules/inventory/movement-service";

export type EntryState = { error?: string };
const optionalReference = z.preprocess(v => v === "" ? undefined : v, z.string().trim().max(120).optional());
const optionalComment = z.preprocess(v => v === "" ? undefined : v, z.string().trim().max(2000).optional());

export async function createEntry(_: EntryState, formData: FormData): Promise<EntryState> {
  const user = await requireUser();
  const parsed = z.object({
    productId: z.string().uuid(), quantity: wholeQuantity.min(1, "La quantité doit être au moins égale à 1."),
    supplierId: z.preprocess(v => v === "" ? undefined : v, z.string().uuid().optional()),
    reference: optionalReference, comment: optionalComment,
    occurredAt: z.coerce.date().max(new Date(), "La date ne peut pas être dans le futur."),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await recordStockMovement({ ...parsed.data, userId: user.id, type: MovementType.IN, reason: MovementReason.PURCHASE });
  } catch (error) {
    return { error: error instanceof StockError ? error.message : "L’entrée n’a pas pu être enregistrée." };
  }
  redirect(`/produits/${parsed.data.productId}`);
}
