import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getApiAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: new Response("Authentification requise.", { status: 401 }) } as const;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, isActive: true } });
  if (!user?.isActive || user.role !== "ADMIN") return { error: new Response("Accès interdit.", { status: 403 }) } as const;
  return { user } as const;
}
