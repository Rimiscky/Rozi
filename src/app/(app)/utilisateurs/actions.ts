"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type UserState = { error?: string; success?: string };

export async function createUser(_: UserState, formData: FormData): Promise<UserState> {
  await requireAdmin();
  const parsed = z.object({ name: z.string().trim().min(2).max(160), username: z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9._-]+$/, "Identifiant invalide."), password: z.string().min(12, "Le mot de passe doit contenir au moins 12 caractères.").max(128), role: z.enum(["ADMIN", "EMPLOYEE"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.user.create({ data: { name: parsed.data.name, username: parsed.data.username.toLowerCase(), passwordHash: await hash(parsed.data.password, 12), role: parsed.data.role as UserRole } });
    revalidatePath("/utilisateurs"); return { success: "Compte créé avec succès." };
  } catch { return { error: "Cet identifiant est déjà utilisé." }; }
}

export async function toggleUser(formData: FormData) {
  const admin = await requireAdmin(); const userId = z.string().uuid().parse(formData.get("userId"));
  if (userId === admin.id) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (user) await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  revalidatePath("/utilisateurs");
}
