"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MovementReason, MovementType } from "@/generated/prisma/client";
import { requireUser } from "@/lib/permissions";
import { recordStockMovement, StockError } from "@/modules/inventory/movement-service";

export type EntryState = { error?: string };
const optional = z.preprocess(v => v === "" ? undefined : v, z.string().trim().max(500).optional());

export async function createEntry(_: EntryState, formData: FormData): Promise<EntryState> {
  const user = await requireUser();
  const parsed = z.object({
    productId: z.string().uuid(), quantity: z.coerce.number().positive().max(999999999),
    supplierId: z.preprocess(v => v === "" ? undefined : v, z.string().uuid().optional()),
    reference: optional, comment: optional,
    occurredAt: z.coerce.date().max(new Date(Date.now() + 86_400_000), "La date est invalide."),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await recordStockMovement({ ...parsed.data, userId: user.id, type: MovementType.IN, reason: MovementReason.PURCHASE });
  } catch (error) {
    return { error: error instanceof StockError ? error.message : "L’entrée n’a pas pu être enregistrée." };
  }
  redirect(`/produits/${parsed.data.productId}`);
}
