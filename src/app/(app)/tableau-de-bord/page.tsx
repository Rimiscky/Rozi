import Link from "next/link";
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, Boxes, PackageX } from "lucide-react";

const stats = [
  { label: "Produits", value: "0", note: "catalogue actif", icon: Boxes, tone: "neutral" },
  { label: "Articles en stock", value: "0", note: "toutes unités", icon: ArrowDownToLine, tone: "green" },
  { label: "Stock faible", value: "0", note: "à réapprovisionner", icon: AlertTriangle, tone: "orange" },
  { label: "Ruptures", value: "0", note: "action nécessaire", icon: PackageX, tone: "red" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-bold text-[var(--brand)]">Mardi 23 septembre</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Bonjour, Rimiscky</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)] sm:text-base">Voici la situation actuelle de votre stock.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/entrees/nouvelle" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold shadow-sm">
            <ArrowDownToLine size={18} className="text-[var(--brand)]" /> Entrée
          </Link>
          <Link href="/sorties/nouvelle" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white shadow-sm shadow-emerald-900/15">
            <ArrowUpFromLine size={18} /> Sortie
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_5px_18px_rgba(16,42,34,.035)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold text-[var(--ink-soft)]">{label}</p>
              <span className={`hidden size-9 place-items-center rounded-xl sm:grid ${tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "orange" ? "bg-amber-50 text-amber-700" : tone === "red" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong className="mt-4 block text-3xl font-extrabold tracking-tight">{value}</strong>
            <span className="mt-1 block text-xs text-[var(--ink-soft)]">{note}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <article className="min-h-72 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Mouvements récents</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Les dernières entrées et sorties apparaîtront ici.</p>
            </div>
            <Link href="/historique" className="hidden items-center gap-1 text-sm font-bold text-[var(--brand)] sm:flex">Tout voir <ArrowRight size={16} /></Link>
          </div>
          <div className="grid min-h-48 place-items-center text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--canvas)] text-[var(--ink-soft)]"><Boxes size={22} /></span>
              <p className="mt-3 text-sm font-bold">Aucun mouvement pour le moment</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Créez votre premier produit pour commencer.</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-[var(--ink)] p-5 text-white sm:p-6">
          <p className="text-sm font-bold text-emerald-300">Démarrage rapide</p>
          <h2 className="mt-2 max-w-xs text-2xl font-extrabold tracking-tight">Ajoutez votre premier produit au catalogue.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Renseignez son unité, son seuil d’alerte et son stock initial. Rozi enregistrera automatiquement le premier mouvement.</p>
          <Link href="/produits/nouveau" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-[var(--ink)]">
            Ajouter un produit <ArrowRight size={17} />
          </Link>
        </article>
      </section>
    </div>
  );
}
