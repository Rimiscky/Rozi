import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const statusLabel = { DRAFT: "Brouillon", ORDERED: "Commandé", RECEIVED: "Réceptionné", CANCELLED: "Annulé" } as const;

export default async function PurchaseOrdersPage() {
  await requireAdmin();
  const orders = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: true, lines: true } });
  return <div className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[var(--brand)]">Approvisionnement</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Bons de commande</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Préparez les achats et réceptionnez-les sans double saisie.</p></div><Link href="/bons-de-commande/nouveau" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white"><Plus size={18} /> Nouveau bon</Link></header><section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="divide-y divide-[var(--line)]">{orders.map((order) => <Link key={order.id} href={`/bons-de-commande/${order.id}`} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_1fr_8rem]"><div><strong>{order.number}</strong><p className="text-xs text-[var(--ink-soft)]">{order.lines.length} ligne(s)</p></div><span>{order.supplier.code} · {order.supplier.name}</span><span className="font-bold">{statusLabel[order.status]}</span></Link>)}{!orders.length ? <p className="p-10 text-center text-sm text-[var(--ink-soft)]">Aucun bon de commande.</p> : null}</div></section></div>;
}
