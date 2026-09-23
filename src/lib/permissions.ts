import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, username: true, email: true, role: true, isActive: true } });
  if (!user?.isActive) redirect("/connexion?erreur=compte-inactif");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/tableau-de-bord");
  return user;
}
