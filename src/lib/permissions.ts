import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permission-policy";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, username: true, email: true, role: true, isActive: true } });
  if (!user?.isActive) redirect("/connexion?erreur=compte-inactif");
  return user;
}

export async function requireAdmin() {
  return requirePermission("user.admin");
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) redirect("/tableau-de-bord?erreur=acces-interdit");
  return user;
}
