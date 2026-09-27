import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  await requirePermission("audit.read");
  const { action } = await searchParams;
  const logs = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    include: { user: { select: { name: true, username: true } } },
  });
  return <div className="space-y-6"><header><p className="text-sm font-bold text-[var(--brand)]">Sécurité et traçabilité</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Journal d’audit</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Les 100 événements les plus récents. Les mots de passe et fichiers importés ne sont jamais enregistrés ici.</p></header><form className="flex gap-2 rounded-2xl border border-[var(--line)] bg-white p-4"><input name="action" defaultValue={action} placeholder="Filtrer par action" className="min-h-11 flex-1 rounded-xl border border-[var(--line)] px-3 text-sm" /><button className="min-h-11 rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white">Filtrer</button></form><section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="divide-y divide-[var(--line)]">{logs.map((log) => <article key={log.id} className="grid gap-2 px-5 py-4 text-sm lg:grid-cols-[12rem_15rem_1fr]"><time className="text-[var(--ink-soft)]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}</time><div><strong>{log.action}</strong><p className="text-xs text-[var(--ink-soft)]">{log.user?.name ?? "Système"} · {log.entityType}</p></div><code className="overflow-x-auto whitespace-pre-wrap text-xs text-[var(--ink-soft)]">{log.metadata ? JSON.stringify(log.metadata) : "—"}</code></article>)}{!logs.length ? <p className="p-10 text-center text-sm text-[var(--ink-soft)]">Aucun événement.</p> : null}</div></section></div>;
}
