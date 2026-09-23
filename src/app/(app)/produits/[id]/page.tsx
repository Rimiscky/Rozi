import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(); const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true, unit: true, supplier: true, inventory: true, movements: { orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } } } });
  if (!product) notFound();
  const quantity = Number(product.inventory?.quantity ?? 0); const threshold = Number(product.alertThreshold); const status = quantity === 0 ? "Rupture" : quantity <= threshold ? "Stock faible" : "En stock";
  return <div className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[var(--brand)]">{product.category.name} · {product.sku}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">{product.supplier?.name ?? "Aucun fournisseur principal"}</p></div><div className="grid grid-cols-2 gap-3"><Link href={`/entrees/nouvelle?produit=${product.id}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold"><ArrowDownToLine size={18} /> Entrée</Link><Link href={`/sorties/nouvelle?produit=${product.id}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white"><ArrowUpFromLine size={18} /> Sortie</Link></div></header>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Stock disponible" value={`${quantity} ${product.unit.symbol}`} /><Metric label="Seuil d’alerte" value={`${Number(product.alertThreshold)} ${product.unit.symbol}`} /><Metric label="État" value={status} /></section>
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="text-lg font-extrabold">Derniers mouvements</h2><div className="mt-4 divide-y divide-[var(--line)]">{product.movements.map(m => <div key={m.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_8rem_8rem]"><div><strong>{m.type === "IN" ? "Entrée" : m.type === "OUT" ? "Sortie" : "Ajustement"}</strong><p className="text-xs text-[var(--ink-soft)]">{m.user.name} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(m.occurredAt)}</p></div><span className="font-bold">{m.delta.greaterThan(0) ? "+" : ""}{Number(m.delta)} {product.unit.symbol}</span><span className="text-[var(--ink-soft)]">{Number(m.stockBefore)} → {Number(m.stockAfter)}</span></div>)}{!product.movements.length ? <p className="py-8 text-center text-sm text-[var(--ink-soft)]">Aucun mouvement.</p> : null}</div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-2xl border border-[var(--line)] bg-white p-5"><p className="text-sm font-bold text-[var(--ink-soft)]">{label}</p><strong className="mt-3 block text-2xl font-extrabold">{value}</strong></article>; }
