import { Building2, Ruler, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { CategoryForm, SupplierForm, UnitForm } from "./settings-forms";

export default async function SettingsPage() {
  await requireAdmin();
  const [categories, units, suppliers] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return <div className="space-y-7">
    <header><p className="text-sm font-bold text-[var(--brand)]">Administration</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Paramètres du catalogue</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Configurez les choix proposés lors de la création d’un produit.</p></header>
    <div className="grid gap-5 xl:grid-cols-3">
      <SettingsCard title="Catégories" icon={Tags} items={categories.map((x) => x.name)}><CategoryForm /></SettingsCard>
      <SettingsCard title="Unités" icon={Ruler} items={units.map((x) => `${x.name} (${x.symbol})`)}><UnitForm /></SettingsCard>
      <SettingsCard title="Fournisseurs" icon={Building2} items={suppliers.map((x) => x.name)}><SupplierForm /></SettingsCard>
    </div>
  </div>;
}

function SettingsCard({ title, icon: Icon, items, children }: { title: string; icon: typeof Tags; items: string[]; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-pale)] text-[var(--brand-dark)]"><Icon size={20} /></span><div><h2 className="font-extrabold">{title}</h2><p className="text-xs text-[var(--ink-soft)]">{items.length} élément{items.length > 1 ? "s" : ""}</p></div></div>
    <div className="my-5 max-h-44 space-y-2 overflow-auto border-y border-[var(--line)] py-4">{items.length ? items.map((item) => <div key={item} className="rounded-lg bg-[var(--canvas)] px-3 py-2 text-sm font-semibold">{item}</div>) : <p className="text-sm text-[var(--ink-soft)]">Aucun élément.</p>}</div>
    {children}
  </section>;
}
