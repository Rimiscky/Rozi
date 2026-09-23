import { Building2, Ruler, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { updateCategory, updateSupplier, updateUnit, toggleSetting } from "./actions";
import { CategoryForm, SupplierForm, UnitForm } from "./settings-forms";

const input = "min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm";

export default async function SettingsPage() {
  await requireAdmin();
  const [categories, units, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    prisma.unit.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    prisma.supplier.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
  ]);
  return <div className="space-y-7"><header><p className="text-sm font-bold text-[var(--brand)]">Administration</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Paramètres du catalogue</h1><p className="mt-2 text-sm text-[var(--ink-soft)]">Modifiez les choix proposés lors de la création d’un produit.</p></header>
    <div className="grid gap-5 xl:grid-cols-3">
      <SettingsCard title="Catégories" icon={Tags} count={categories.length} creator={<CategoryForm />}>{categories.map(item => <EditableRow key={item.id} title={item.name} active={item.isActive} id={item.id} entity="Category"><form action={updateCategory} className="space-y-2"><input type="hidden" name="id" value={item.id} /><input name="name" defaultValue={item.name} className={input} required /><SaveButton /></form></EditableRow>)}</SettingsCard>
      <SettingsCard title="Unités" icon={Ruler} count={units.length} creator={<UnitForm />}>{units.map(item => <EditableRow key={item.id} title={`${item.name} (${item.symbol})`} active={item.isActive} id={item.id} entity="Unit"><form action={updateUnit} className="space-y-2"><input type="hidden" name="id" value={item.id} /><div className="grid grid-cols-[1fr_5rem] gap-2"><input name="name" defaultValue={item.name} className={input} required /><input name="symbol" defaultValue={item.symbol} className={input} required /></div><select name="decimals" defaultValue={item.decimals} className={input}><option value="0">Entier</option><option value="1">1 décimale</option><option value="2">2 décimales</option><option value="3">3 décimales</option></select><SaveButton /></form></EditableRow>)}</SettingsCard>
      <SettingsCard title="Fournisseurs" icon={Building2} count={suppliers.length} creator={<SupplierForm />}>{suppliers.map(item => <EditableRow key={item.id} title={item.name} active={item.isActive} id={item.id} entity="Supplier"><form action={updateSupplier} className="space-y-2"><input type="hidden" name="id" value={item.id} /><input name="name" defaultValue={item.name} className={input} required /><input name="phone" defaultValue={item.phone ?? ""} className={input} placeholder="Téléphone" /><input name="email" type="email" defaultValue={item.email ?? ""} className={input} placeholder="E-mail" /><SaveButton /></form></EditableRow>)}</SettingsCard>
    </div></div>;
}

function SettingsCard({ title, icon: Icon, count, creator, children }: { title: string; icon: typeof Tags; count: number; creator: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-pale)] text-[var(--brand-dark)]"><Icon size={20} /></span><div><h2 className="font-extrabold">{title}</h2><p className="text-xs text-[var(--ink-soft)]">{count} élément{count > 1 ? "s" : ""}</p></div></div><div className="my-5 max-h-80 space-y-2 overflow-auto border-y border-[var(--line)] py-4">{children}</div>{creator}</section>; }

function EditableRow({ title, active, id, entity, children }: { title: string; active: boolean; id: string; entity: "Category" | "Unit" | "Supplier"; children: React.ReactNode }) { return <details className={`rounded-xl border border-[var(--line)] p-3 ${active ? "bg-[var(--canvas)]" : "bg-slate-100 opacity-70"}`}><summary className="cursor-pointer text-sm font-bold">{title}{!active ? " · Désactivé" : ""}</summary><div className="mt-3 space-y-2">{children}<form action={toggleSetting}><input type="hidden" name="id" value={id} /><input type="hidden" name="entity" value={entity} /><input type="hidden" name="active" value={String(active)} /><button className="min-h-9 w-full rounded-lg border border-[var(--line)] px-3 text-xs font-bold">{active ? "Désactiver" : "Réactiver"}</button></form></div></details>; }

function SaveButton() { return <button className="min-h-9 w-full rounded-lg bg-[var(--ink)] px-3 text-xs font-bold text-white">Enregistrer</button>; }
