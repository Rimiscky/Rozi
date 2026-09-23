import Link from "next/link";
import { PackagePlus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const products = await prisma.product.findMany({
    where: { isActive: true, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}) },
    include: { category: true, unit: true, inventory: true },
    orderBy: { name: "asc" },
  });
  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[var(--brand)]">Catalogue</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Produits</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">{products.length} produit{products.length > 1 ? "s" : ""} affiché{products.length > 1 ? "s" : ""}</p></div>{user.role === "ADMIN" ? <Link href="/produits/nouveau" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-extrabold text-white"><PackagePlus size={18} /> Nouveau produit</Link> : null}</header>
    <form className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" size={19} /><input name="q" defaultValue={q} className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-white pl-12 pr-4 text-base outline-none focus:border-[var(--brand)]" placeholder="Rechercher par nom ou référence…" /></form>
    <div className="grid gap-3">
      {products.map((p) => { const quantity = Number(p.inventory?.quantity ?? 0); const threshold = Number(p.alertThreshold); const status = quantity === 0 ? "Rupture" : quantity <= threshold ? "Stock faible" : "En stock"; return <Link key={p.id} href={`/produits/${p.id}`} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 transition hover:border-emerald-300 sm:grid-cols-[1fr_10rem_9rem] sm:items-center"><div><h2 className="font-extrabold">{p.name}</h2><p className="mt-1 text-xs text-[var(--ink-soft)]">{p.sku} · {p.category.name}</p></div><p className="text-sm sm:text-right"><strong className="text-lg">{quantity}</strong> {p.unit.symbol}</p><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold sm:justify-self-end ${status === "En stock" ? "bg-emerald-50 text-emerald-700" : status === "Stock faible" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{status}</span></Link>; })}
      {!products.length ? <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center"><p className="font-bold">Aucun produit trouvé</p><p className="mt-1 text-sm text-[var(--ink-soft)]">Créez un produit ou modifiez votre recherche.</p></div> : null}
    </div>
  </div>;
}
