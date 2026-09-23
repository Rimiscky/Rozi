import Link from "next/link";
import type { Session } from "next-auth";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/auth";

const primaryNavigation = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/produits", label: "Produits", icon: Boxes },
  { href: "/entrees/nouvelle", label: "Entrées", icon: ArrowDownToLine },
  { href: "/sorties/nouvelle", label: "Sorties", icon: ArrowUpFromLine },
  { href: "/historique", label: "Historique", icon: ClipboardList },
  { href: "/rapports", label: "Rapports", icon: BarChart3 },
];

const adminNavigation = [
  { href: "/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: Session["user"] }) {
  const initials = user.name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || user.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-[var(--line)] bg-[var(--ink)] px-4 py-6 text-white lg:flex lg:flex-col">
        <Link href="/tableau-de-bord" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand)] text-lg font-extrabold">R</span>
          <span>
            <strong className="block text-xl tracking-tight">Rozi</strong>
            <small className="text-xs text-white/55">Gestion de stock</small>
          </span>
        </Link>

        <nav className="mt-10 space-y-1" aria-label="Navigation principale">
          {primaryNavigation.map(({ href, label, icon: Icon }, index) => (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                index === 0 ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          {user.role === "ADMIN" ? adminNavigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white">
              <Icon size={19} aria-hidden="true" />
              {label}
            </Link>
          )) : null}
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur md:px-7 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <button className="grid size-11 place-items-center rounded-xl border border-[var(--line)]" aria-label="Ouvrir le menu">
              <Menu size={21} />
            </button>
            <Link href="/tableau-de-bord" className="text-xl font-extrabold tracking-tight">Rozi</Link>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-[var(--ink-soft)]">Quincaillerie principale</p>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/connexion" }); }}>
            <button type="submit" className="grid size-10 place-items-center rounded-full bg-[var(--brand-pale)] text-sm font-extrabold text-[var(--brand-dark)]" aria-label={`Déconnecter ${user.name ?? user.username}`} title="Se déconnecter">
              {initials}
            </button>
          </form>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-6 md:px-7 lg:px-9 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--line)] bg-white px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(16,42,34,.07)] lg:hidden" aria-label="Navigation mobile">
        <MobileLink href="/tableau-de-bord" label="Accueil" icon={LayoutDashboard} active />
        <MobileLink href="/produits" label="Produits" icon={Boxes} />
        <MobileLink href="/entrees/nouvelle" label="Entrée" icon={PackagePlus} emphasized />
        <MobileLink href="/sorties/nouvelle" label="Sortie" icon={ArrowUpFromLine} />
        <MobileLink href="/parametres" label="Plus" icon={Menu} />
      </nav>
    </div>
  );
}

function MobileLink({ href, label, icon: Icon, active = false, emphasized = false }: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active?: boolean;
  emphasized?: boolean;
}) {
  return (
    <Link href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${active ? "text-[var(--brand)]" : "text-[var(--ink-soft)]"}`}>
      <span className={emphasized ? "-mt-5 grid size-12 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-lg shadow-emerald-900/20" : "grid h-7 place-items-center"}>
        <Icon size={emphasized ? 22 : 21} aria-hidden="true" />
      </span>
      {label}
    </Link>
  );
}
