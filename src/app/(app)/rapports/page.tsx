import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, AlertTriangle, PackageX } from "lucide-react";
import { MovementType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

type Params = { periode?: string; from?: string; to?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(); const params = await searchParams; const now = new Date(); const end = new Date(now); end.setHours(23, 59, 59, 999); let start = new Date(now); start.setHours(0, 0, 0, 0); const period = params.periode ?? "today";
  if (period === "week") { const day = start.getDay() || 7; start.setDate(start.getDate() - day + 1); }
  if (period === "month") start.setDate(1);
  if (period === "custom" && params.from) start = new Date(`${params.from}T00:00:00`);
  if (period === "custom" && params.to) { const customEnd = new Date(`${params.to}T23:59:59.999`); end.setTime(customEnd.getTime()); }

  const [movements, products] = await Promise.all([
    prisma.stockMovement.findMany({ where: { occurredAt: { gte: start, lte: end } }, select: { productId: true, type: true, quantity: true, product: { select: { name: true, sku: true, unit: { select: { symbol: true } } } } } }),
    prisma.product.findMany({ where: { isActive: true }, include: { inventory: true, unit: true }, orderBy: { name: "asc" } }),
  ]);
  const entries = movements.filter(m => m.type === MovementType.IN); const exits = movements.filter(m => m.type === MovementType.OUT); const entryTotal = entries.reduce((sum, m) => sum + Number(m.quantity), 0); const exitTotal = exits.reduce((sum, m) => sum + Number(m.quantity), 0);
  const outProducts = products.filter(p => Number(p.inventory?.quantity ?? 0) === 0); const lowProducts = products.filter(p => Number(p.inventory?.quantity ?? 0) > 0 && Number(p.inventory?.quantity ?? 0) <= Number(p.alertThreshold));
  const grouped = new Map<string, { id: string; name: string; sku: string; unit: string; entries: number; exits: number }>();
  for (const movement of movements) { const current = grouped.get(movement.productId) ?? { id: movement.productId, name: movement.product.name, sku: movement.product.sku, unit: movement.product.unit.symbol, entries: 0, exits: 0 }; if (movement.type === MovementType.IN) current.entries += Number(movement.quantity); if (movement.type === MovementType.OUT) current.exits += Number(movement.quantity); grouped.set(movement.productId, current); }
  const rows = [...grouped.values()].sort((a, b) => b.exits - a.exits || b.entries - a.entries);

  return <div className="space-y-6">
    <header><p className="text-sm font-bold text-[var(--brand)]">Analyse du stock</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Rapports</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Du {new Intl.DateTimeFormat("fr-FR").format(start)} au {new Intl.DateTimeFormat("fr-FR").format(end)}</p></header>
    <form className="grid gap-2 rounded-2xl border border-[var(--line)] bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><select name="periode" defaultValue={period} className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="today">Aujourd’hui</option><option value="week">Cette semaine</option><option value="month">Ce mois</option><option value="custom">Période personnalisée</option></select><input name="from" type="date" defaultValue={params.from} aria-label="Date de début" className="min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm" /><input name="to" type="date" defaultValue={params.to} aria-label="Date de fin" className="min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm" /><button className="min-h-11 rounded-xl bg-[var(--ink)] px-5 text-sm font-bold text-white">Afficher</button></form>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric label="Total des entrées" value={entryTotal} detail={`${entries.length} opération(s)`} icon={ArrowDownToLine} tone="green" /><Metric label="Total des sorties" value={exitTotal} detail={`${exits.length} opération(s)`} icon={ArrowUpFromLine} tone="red" /><Metric label="Stocks faibles" value={lowProducts.length} detail="à réapprovisionner" icon={AlertTriangle} tone="orange" /><Metric label="Ruptures" value={outProducts.length} detail="stock égal à zéro" icon={PackageX} tone="red" /></section>
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="border-b border-[var(--line)] p-5"><h2 className="text-lg font-extrabold">Mouvements par produit</h2><p className="mt-1 text-sm text-[var(--ink-soft)]">Classés par quantité sortie</p></div><div className="hidden grid-cols-[1fr_9rem_9rem] bg-[var(--canvas)] px-5 py-3 text-xs font-extrabold uppercase text-[var(--ink-soft)] sm:grid"><span>Produit</span><span>Entrées</span><span>Sorties</span></div><div className="divide-y divide-[var(--line)]">{rows.map(row => <Link key={row.id} href={`/produits/${row.id}`} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_9rem_9rem]"><div><strong>{row.name}</strong><p className="text-xs text-[var(--ink-soft)]">{row.sku}</p></div><span className="font-bold text-emerald-700">+{row.entries} {row.unit}</span><span className="font-bold text-red-700">-{row.exits} {row.unit}</span></Link>)}{!rows.length ? <p className="p-10 text-center text-sm text-[var(--ink-soft)]">Aucun mouvement sur cette période.</p> : null}</div></section>
  </div>;
}

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof ArrowDownToLine; tone: string }) { return <article className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5"><div className="flex items-start justify-between"><p className="text-sm font-bold text-[var(--ink-soft)]">{label}</p><Icon size={18} className={tone === "green" ? "text-emerald-700" : tone === "orange" ? "text-amber-700" : "text-red-700"} /></div><strong className="mt-4 block text-3xl font-extrabold">{value}</strong><span className="mt-1 block text-xs text-[var(--ink-soft)]">{detail}</span></article>; }
