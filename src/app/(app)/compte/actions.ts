"use server";

import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export type PasswordState = { error?: string; success?: string };

export async function changePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12, "Le nouveau mot de passe doit contenir au moins 12 caractères.").max(128), confirmation: z.string() }).refine(data => data.newPassword === data.confirmation, { message: "Les deux nouveaux mots de passe ne correspondent pas." }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await compare(parsed.data.currentPassword, record.passwordHash))) return { error: "Le mot de passe actuel est incorrect." };
  await prisma.$transaction([prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hash(parsed.data.newPassword, 12) } }), prisma.auditLog.create({ data: { userId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id } })]);
  return { success: "Mot de passe modifié avec succès." };
}
