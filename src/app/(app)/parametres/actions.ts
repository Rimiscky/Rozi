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

export async function updateCategory(formData: FormData) {
  const user = await requireAdmin(); const id = z.string().uuid().parse(formData.get("id")); const name = nameSchema.parse(formData.get("name"));
  await prisma.$transaction([prisma.category.update({ where: { id }, data: { name } }), prisma.auditLog.create({ data: { userId: user.id, action: "CATEGORY_UPDATED", entityType: "Category", entityId: id } })]); revalidatePath("/parametres");
}

export async function updateUnit(formData: FormData) {
  const user = await requireAdmin(); const data = z.object({ id: z.string().uuid(), name: nameSchema, symbol: z.string().trim().min(1).max(20), decimals: z.coerce.number().int().min(0).max(3) }).parse(Object.fromEntries(formData));
  await prisma.$transaction([prisma.unit.update({ where: { id: data.id }, data: { name: data.name, symbol: data.symbol, decimals: data.decimals } }), prisma.auditLog.create({ data: { userId: user.id, action: "UNIT_UPDATED", entityType: "Unit", entityId: data.id } })]); revalidatePath("/parametres");
}

export async function updateSupplier(formData: FormData) {
  const user = await requireAdmin(); const data = z.object({ id: z.string().uuid(), name: nameSchema, phone: z.string().trim().max(40), email: z.string().trim().max(255) }).parse(Object.fromEntries(formData));
  await prisma.$transaction([prisma.supplier.update({ where: { id: data.id }, data: { name: data.name, phone: data.phone || null, email: data.email || null } }), prisma.auditLog.create({ data: { userId: user.id, action: "SUPPLIER_UPDATED", entityType: "Supplier", entityId: data.id } })]); revalidatePath("/parametres");
}

export async function toggleSetting(formData: FormData) {
  const user = await requireAdmin(); const id = z.string().uuid().parse(formData.get("id")); const entity = z.enum(["Category", "Unit", "Supplier"]).parse(formData.get("entity")); const active = formData.get("active") === "true";
  if (entity === "Category") await prisma.category.update({ where: { id }, data: { isActive: !active } });
  if (entity === "Unit") await prisma.unit.update({ where: { id }, data: { isActive: !active } });
  if (entity === "Supplier") await prisma.supplier.update({ where: { id }, data: { isActive: !active } });
  await prisma.auditLog.create({ data: { userId: user.id, action: active ? `${entity.toUpperCase()}_DISABLED` : `${entity.toUpperCase()}_ENABLED`, entityType: entity, entityId: id } }); revalidatePath("/parametres");
}
