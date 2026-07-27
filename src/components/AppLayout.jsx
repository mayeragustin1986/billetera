import { LayoutDashboard, LogOut, Menu, ReceiptText, Tags, Wallet, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/movimientos", label: "Movimientos", icon: ReceiptText },
  { to: "/categorias", label: "Categorías", icon: Tags },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Wallet size={23} /></span>
            <div><p className="text-lg font-bold">Billetera</p><p className="text-xs text-slate-500">Finanzas personales</p></div>
          </NavLink>
          <button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X /></button>
        </div>
        <nav className="space-y-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 transition ${isActive ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={20} /><span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="truncate text-sm font-semibold capitalize">{name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300">
            <LogOut size={19} /> Cerrar sesión
          </button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-white/10 bg-slate-950/80 px-5 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <span className="ml-4 font-bold">Billetera</span>
        </header>
        <div className="mx-auto max-w-7xl p-5 sm:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
