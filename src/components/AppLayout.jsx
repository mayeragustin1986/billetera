import { CalendarClock, Clock3, House, LogOut, Settings, Shapes, Wallet } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/", label: "Inicio", icon: House, end: true },
  { to: "/movimientos", label: "Mi plata", icon: Clock3 },
  { to: "/agenda-pagos", label: "Agenda", icon: CalendarClock },
  { to: "/categorias", label: "Ordenar", icon: Shapes },
  { to: "/configuracion", label: "Configurar", icon: Settings },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "Hola";

  return (
    <div className="min-h-screen bg-[#08090a] pb-28 text-[#f5f5f7] md:pb-0">
      <header className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0a84ff] text-white"><Wallet size={23} strokeWidth={2.4} /></span>
          <span className="text-xl font-bold tracking-tight">Billetera</span>
        </NavLink>
        <div className="hidden items-center gap-2 md:flex">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-12 items-center gap-2 rounded-full px-5 text-base font-semibold transition ${isActive ? "bg-white text-black" : "text-[#8e8e93] hover:bg-white/5 hover:text-white"}`}>
              <Icon size={19} />{label}
            </NavLink>
          ))}
        </div>
        <button onClick={signOut} className="flex min-h-12 items-center gap-2 rounded-full px-4 text-[#8e8e93] hover:bg-white/5 hover:text-white" aria-label="Salir">
          <span className="hidden sm:inline">Hola, {name}</span><LogOut size={19} />
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-12 pt-4 sm:px-8 sm:pt-10"><Outlet /></main>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1e]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition ${isActive ? "bg-white text-black" : "text-[#8e8e93]"}`}>
            <Icon size={22} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
