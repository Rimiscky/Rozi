"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type SettingsState = { error?: string; success?: string };

const nameSchema = z.string().trim().min(2, "Le nom est trop court.").max(160);

export async function createCategory(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.category.create({ data: { name: parsed.data } });
      await tx.auditLog.create({ data: { userId: user.id, action: "CATEGORY_CREATED", entityType: "Category", entityId: item.id } });
    });
    revalidatePath("/parametres");
    return { success: "Catégorie ajoutée." };
  } catch {
    return { error: "Cette catégorie existe déjà." };
  }
}

export async function createUnit(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireAdmin();
  const parsed = z.object({
    name: nameSchema,
    symbol: z.string().trim().min(1).max(20),
    decimals: z.coerce.number().int().min(0).max(3),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.unit.create({ data: parsed.data });
      await tx.auditLog.create({ data: { userId: user.id, action: "UNIT_CREATED", entityType: "Unit", entityId: item.id } });
    });
    revalidatePath("/parametres");
    return { success: "Unité ajoutée." };
  } catch {
    return { error: "Cette unité existe déjà." };
  }
}

export async function createSupplier(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireAdmin();
  const optionalText = z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(255).optional());
  const parsed = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Code fournisseur invalide."),
    name: nameSchema,
    contactName: optionalText,
    phone: optionalText,
    email: z.preprocess((value) => value === "" ? undefined : value, z.string().email("Adresse e-mail invalide.").optional()),
    address: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(1000).optional()),
    paymentTermsDays: z.coerce.number().int().min(0).max(365),
    leadTimeDays: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(0).max(365).optional()),
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.supplier.create({ data: { ...parsed.data, code: parsed.data.code.toUpperCase() } });
      await tx.auditLog.create({ data: { userId: user.id, action: "SUPPLIER_CREATED", entityType: "Supplier", entityId: item.id, metadata: { code: item.code } } });
    });
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
  const user = await requireAdmin(); const data = z.object({ id: z.string().uuid(), code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/), name: nameSchema, contactName: z.string().trim().max(160), phone: z.string().trim().max(40), email: z.union([z.literal(""), z.string().email()]), address: z.string().trim().max(1000), paymentTermsDays: z.coerce.number().int().min(0).max(365), leadTimeDays: z.union([z.literal(""), z.coerce.number().int().min(0).max(365)]) }).parse(Object.fromEntries(formData));
  await prisma.$transaction([prisma.supplier.update({ where: { id: data.id }, data: { code: data.code.toUpperCase(), name: data.name, contactName: data.contactName || null, phone: data.phone || null, email: data.email || null, address: data.address || null, paymentTermsDays: data.paymentTermsDays, leadTimeDays: data.leadTimeDays === "" ? null : data.leadTimeDays } }), prisma.auditLog.create({ data: { userId: user.id, action: "SUPPLIER_UPDATED", entityType: "Supplier", entityId: data.id } })]); revalidatePath("/parametres"); revalidatePath("/fournisseurs");
}

export async function toggleSetting(formData: FormData) {
  const user = await requireAdmin(); const id = z.string().uuid().parse(formData.get("id")); const entity = z.enum(["Category", "Unit", "Supplier"]).parse(formData.get("entity"));
  await prisma.$transaction(async (tx) => {
    let active: boolean | undefined;
    if (entity === "Category") { const item = await tx.category.findUnique({ where: { id }, select: { isActive: true } }); active = item?.isActive; if (item) await tx.category.update({ where: { id }, data: { isActive: !item.isActive } }); }
    if (entity === "Unit") { const item = await tx.unit.findUnique({ where: { id }, select: { isActive: true } }); active = item?.isActive; if (item) await tx.unit.update({ where: { id }, data: { isActive: !item.isActive } }); }
    if (entity === "Supplier") { const item = await tx.supplier.findUnique({ where: { id }, select: { isActive: true } }); active = item?.isActive; if (item) await tx.supplier.update({ where: { id }, data: { isActive: !item.isActive } }); }
    if (active === undefined) return;
    await tx.auditLog.create({ data: { userId: user.id, action: active ? `${entity.toUpperCase()}_DISABLED` : `${entity.toUpperCase()}_ENABLED`, entityType: entity, entityId: id, metadata: { before: { isActive: active }, after: { isActive: !active } } } });
  }); revalidatePath("/parametres");
}
