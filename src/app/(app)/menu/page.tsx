import Link from "next/link";
import { BarChart3, ChevronRight, ClipboardList, KeyRound, Settings, SlidersHorizontal, Users } from "lucide-react";
import { requireUser } from "@/lib/permissions";

export default async function MenuPage() {
  const user = await requireUser();
  const links = [
    { href: "/compte", label: "Mon compte", description: "Modifier mon mot de passe", icon: KeyRound },
    { href: "/historique", label: "Historique", description: "Rechercher et filtrer les mouvements", icon: ClipboardList },
    { href: "/rapports", label: "Rapports", description: "Analyser une période", icon: BarChart3 },
    ...(user.role === "ADMIN" ? [
      { href: "/ajustements/nouveau", label: "Ajuster le stock", description: "Corriger après un inventaire", icon: SlidersHorizontal },
      { href: "/utilisateurs", label: "Utilisateurs", description: "Gérer les comptes et les rôles", icon: Users },
      { href: "/parametres", label: "Paramètres", description: "Catégories, unités et fournisseurs", icon: Settings },
    ] : []),
  ];
  return <div className="mx-auto max-w-2xl space-y-6"><header><p className="text-sm font-bold text-[var(--brand)]">Navigation</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Plus d’options</h1></header><section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="divide-y divide-[var(--line)]">{links.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="flex min-h-20 items-center gap-4 px-4 py-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-pale)] text-[var(--brand-dark)]"><Icon size={21} /></span><span className="min-w-0 flex-1"><strong className="block">{label}</strong><small className="text-[var(--ink-soft)]">{description}</small></span><ChevronRight size={19} className="text-[var(--ink-soft)]" /></Link>)}</div></section></div>;
}
