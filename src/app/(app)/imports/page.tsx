import Link from "next/link";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/permissions";
import { ImportForm } from "./import-form";

export default async function ImportsPage() {
  await requireAdmin();
  return <div className="space-y-6">
    <header><p className="text-sm font-bold text-[var(--brand)]">Administration des données</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Imports et exports CSV</h1><p className="mt-2 max-w-3xl text-sm text-[var(--ink-soft)]">Créez un catalogue à partir d’un fichier contrôlé ou exportez une sauvegarde lisible dans Excel. L’import ne modifie jamais directement un stock existant.</p></header>
    <section className="grid gap-3 sm:grid-cols-2">
      <Link href="/api/exports/products" className="flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-5 font-bold"><Download size={20} className="text-[var(--brand)]" /> Exporter les produits</Link>
      <Link href="/api/exports/movements" className="flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-5 font-bold"><Download size={20} className="text-[var(--brand)]" /> Exporter les mouvements</Link>
    </section>
    <ImportForm />
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm"><h2 className="font-extrabold">Colonnes obligatoires</h2><code className="mt-3 block overflow-x-auto rounded-xl bg-[var(--canvas)] p-3 text-xs">sku;name;category;unit;supplier;alert_threshold;purchase_price;sale_price</code><p className="mt-3 text-[var(--ink-soft)]">Les catégories, unités et fournisseurs doivent déjà exister et être actifs. Les prix utilisent un point comme séparateur décimal.</p></section>
  </div>;
}
