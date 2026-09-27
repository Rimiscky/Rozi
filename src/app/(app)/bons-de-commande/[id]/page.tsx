import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { receivePurchaseOrder } from "../actions";

const statusLabel = { DRAFT: "Brouillon", ORDERED: "Commandé", RECEIVED: "Réceptionné", CANCELLED: "Annulé" } as const;

export default async function PurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params;
  const order = await prisma.purchaseOrder.findUnique({ where: { id }, include: { supplier: true, createdBy: { select: { name: true } }, lines: { orderBy: { position: "asc" } } } });
  if (!order) notFound();
  const total = order.lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unitPriceMinor ?? 0), 0) / 100;
  return <div className="space-y-6"><header><p className="text-sm font-bold text-[var(--brand)]">{statusLabel[order.status]}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{order.number}</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">{order.supplier.code} · {order.supplier.name} · créé par {order.createdBy.name}</p></header><section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="divide-y divide-[var(--line)]">{order.lines.map((line) => <div key={line.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_9rem_9rem]"><div><strong>{line.productNameSnapshot}</strong><p className="text-xs text-[var(--ink-soft)]">{line.productSkuSnapshot}</p></div><span>{line.quantity.toString()} {line.unitSymbolSnapshot}</span><span>{line.unitPriceMinor === null ? "Prix non renseigné" : `${(line.unitPriceMinor / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`}</span></div>)}</div><div className="border-t border-[var(--line)] p-5 text-right font-extrabold">Total indicatif : {total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div></section>{order.status === "ORDERED" ? <form action={receivePurchaseOrder} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><input type="hidden" name="orderId" value={order.id} /><h2 className="font-extrabold text-emerald-950">Réception complète</h2><p className="mt-1 text-sm text-emerald-800">Cette action crée une entrée de stock par ligne et ne peut être exécutée qu’une fois.</p><button className="mt-4 min-h-11 rounded-xl bg-emerald-800 px-5 text-sm font-bold text-white">Réceptionner toutes les lignes</button></form> : null}</div>;
}
