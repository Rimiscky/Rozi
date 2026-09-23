"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type SettingsState = { error?: string; success?: string };

const nameSchema = z.string().trim().min(2, "Le nom est trop court.").max(160);

export async function createCategory(_: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.category.create({ data: { name: parsed.data } });
    revalidatePath("/parametres");
    return { success: "Catégorie ajoutée." };
  } catch {
    return { error: "Cette catégorie existe déjà." };
  }
}

export async function createUnit(_: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const parsed = z.object({
    name: nameSchema,
    symbol: z.string().trim().min(1).max(20),
    decimals: z.coerce.number().int().min(0).max(3),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.unit.create({ data: parsed.data });
    revalidatePath("/parametres");
    return { success: "Unité ajoutée." };
  } catch {
    return { error: "Cette unité existe déjà." };
  }
}

export async function createSupplier(_: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const optionalText = z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(255).optional());
  const parsed = z.object({
    name: nameSchema,
    phone: optionalText,
    email: z.preprocess((value) => value === "" ? undefined : value, z.string().email("Adresse e-mail invalide.").optional()),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.supplier.create({ data: parsed.data });
    revalidatePath("/parametres");
    return { success: "Fournisseur ajouté." };
  } catch {
    return { error: "Ce fournisseur existe déjà." };
  }
}
