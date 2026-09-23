import Link from "next/link";
import { MovementType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

type Filters = { q?: string; type?: string; productId?: string; categoryId?: string; userId?: string; from?: string; to?: string };
const input = "min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--brand)]";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireUser(); const filters = await searchParams;
  const where: Prisma.StockMovementWhereInput = {};
  if (filters.type && Object.values(MovementType).includes(filters.type as MovementType)) where.type = filters.type as MovementType;
  if (filters.productId) where.productId = filters.productId;
  if (filters.categoryId) where.product = { categoryId: filters.categoryId };
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) where.occurredAt = { ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}) };
  if (filters.q) where.OR = [{ product: { name: { contains: filters.q, mode: "insensitive" } } }, { product: { sku: { contains: filters.q, mode: "insensitive" } } }, { reference: { contains: filters.q, mode: "insensitive" } }, { comment: { contains: filters.q, mode: "insensitive" } }];

  const [movements, products, categories, users] = await Promise.all([
    prisma.stockMovement.findMany({ where, include: { product: { include: { unit: true } }, user: { select: { id: true, name: true } } }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], take: 200 }),
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return <div className="space-y-6">
    <header><p className="text-sm font-bold text-[var(--brand)]">Traçabilité</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Historique des mouvements</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">{movements.length} mouvement{movements.length > 1 ? "s" : ""} affiché{movements.length > 1 ? "s" : ""} · maximum 200</p></header>
    <form className="grid gap-2 rounded-2xl border border-[var(--line)] bg-white p-4 md:grid-cols-4 xl:grid-cols-7">
      <input name="q" defaultValue={filters.q} className={`${input} md:col-span-2`} placeholder="Produit, référence, commentaire…" />
      <select name="type" defaultValue={filters.type ?? ""} className={input}><option value="">Tous les types</option><option value="IN">Entrées</option><option value="OUT">Sorties</option><option value="ADJUSTMENT">Ajustements</option></select>
      <select name="productId" defaultValue={filters.productId ?? ""} className={input}><option value="">Tous les produits</option>{products.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="categoryId" defaultValue={filters.categoryId ?? ""} className={input}><option value="">Toutes les catégories</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select name="userId" defaultValue={filters.userId ?? ""} className={input}><option value="">Tous les utilisateurs</option>{users.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <div className="grid grid-cols-2 gap-2 md:col-span-2"><input aria-label="Date de début" name="from" type="date" defaultValue={filters.from} className={input} /><input aria-label="Date de fin" name="to" type="date" defaultValue={filters.to} className={input} /></div>
      <div className="flex gap-2 md:col-span-2"><button className="min-h-11 flex-1 rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white">Filtrer</button><Link href="/historique" className="grid min-h-11 place-items-center rounded-xl border border-[var(--line)] px-4 text-sm font-bold">Effacer</Link></div>
    </form>
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="hidden grid-cols-[9rem_1fr_7rem_7rem_9rem_10rem] gap-3 border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-[var(--ink-soft)] lg:grid"><span>Date</span><span>Produit</span><span>Type</span><span>Quantité</span><span>Stock</span><span>Utilisateur</span></div>
      <div className="divide-y divide-[var(--line)]">{movements.map(m => <article key={m.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[9rem_1fr_7rem_7rem_9rem_10rem] lg:items-center lg:px-5">
        <span className="text-xs text-[var(--ink-soft)]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(m.occurredAt)}</span>
        <div><Link href={`/produits/${m.productId}`} className="font-extrabold hover:text-[var(--brand)]">{m.product.name}</Link><p className="text-xs text-[var(--ink-soft)]">{m.product.sku}{m.comment ? ` · ${m.comment}` : ""}</p></div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${m.type === "IN" ? "bg-emerald-50 text-emerald-700" : m.type === "OUT" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{m.type === "IN" ? "Entrée" : m.type === "OUT" ? "Sortie" : "Ajustement"}</span>
        <strong className={m.delta.greaterThan(0) ? "text-emerald-700" : "text-red-700"}>{m.delta.greaterThan(0) ? "+" : ""}{Number(m.delta)} {m.product.unit.symbol}</strong>
        <span>{Number(m.stockBefore)} → {Number(m.stockAfter)}</span><span className="text-[var(--ink-soft)]">{m.user.name}</span>
      </article>)}{!movements.length ? <p className="p-10 text-center text-sm text-[var(--ink-soft)]">Aucun mouvement ne correspond à ces filtres.</p> : null}</div>
    </section>
  </div>;
}
