"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DailyPoint = { day: string; entrees: number; sorties: number };
type ProductPoint = { name: string; quantity: number };

export function DashboardCharts({ daily, topProducts }: { daily: DailyPoint[]; topProducts: ProductPoint[] }) {
  return <section className="grid gap-5 xl:grid-cols-2">
    <article className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><h2 className="text-lg font-extrabold">Entrées et sorties</h2><p className="mt-1 text-sm text-[var(--ink-soft)]">Quantités déplacées sur les 7 derniers jours</p><div className="mt-5 h-64" role="img" aria-label="Graphique des entrées et sorties des sept derniers jours"><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{ left: -20, right: 8 }}><CartesianGrid stroke="#e8eeeb" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="entrees" name="Entrées" stroke="#0d7c59" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="sorties" name="Sorties" stroke="#c13d45" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></article>
    <article className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><h2 className="text-lg font-extrabold">Produits les plus sortis</h2><p className="mt-1 text-sm text-[var(--ink-soft)]">Classement cumulé des mouvements de sortie</p><div className="mt-5 h-64" role="img" aria-label="Graphique des produits les plus sortis">{topProducts.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts} layout="vertical" margin={{ left: 15, right: 8 }}><CartesianGrid stroke="#e8eeeb" horizontal={false} /><XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="quantity" name="Quantité sortie" fill="#0d7c59" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-sm text-[var(--ink-soft)]">Aucune sortie enregistrée.</div>}</div></article>
  </section>;
}
