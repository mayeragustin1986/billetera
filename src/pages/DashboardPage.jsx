import { ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, Plus, ReceiptText, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import TransactionForm from "../components/TransactionForm";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { user } = useAuth();
  const { data = [], isLoading, error, create } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const totals = useMemo(() => data.reduce((sum, item) => {
    if (item.status === "paid") sum[item.type] += Number(item.amount);
    return sum;
  }, { income: 0, expense: 0 }), [data]);
  const monthly = useMemo(() => {
    const now = new Date();
    return data.reduce((sum, item) => {
      const date = new Date(`${item.occurred_at}T12:00:00`);
      if (item.status === "paid" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        sum[item.type] += Number(item.amount);
      }
      return sum;
    }, { income: 0, expense: 0 });
  }, [data]);
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data
      .filter((item) => item.status === "pending" && item.due_date && item.due_date >= today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, [data]);
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "hola";

  const save = async (values) => {
    await create.mutateAsync(values);
    setShowForm(false);
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm text-emerald-300">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p><h1 className="mt-1 text-3xl font-bold capitalize">Hola, {name}</h1><p className="mt-2 text-slate-500">Este es el estado de tus finanzas.</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={19} /> Nuevo movimiento</button>
      </div>
      {error && <div className="mt-7 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">No se pudieron cargar los movimientos. Aplicá la migración de Supabase incluida en el proyecto.</div>}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric title="Balance total" value={totals.income - totals.expense} icon={Wallet} tone="emerald" />
        <Metric title="Ingresos del mes" value={monthly.income} icon={ArrowUpRight} tone="sky" />
        <Metric title="Gastos del mes" value={monthly.expense} icon={ArrowDownRight} tone="rose" />
      </section>
      <section className="panel mt-6 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><CalendarClock size={20} /></span>
          <div><h2 className="font-bold">Próximos vencimientos</h2><p className="text-sm text-slate-500">Pagos pendientes más cercanos</p></div>
        </div>
        {upcoming.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.025] p-4">
                <CalendarClock size={19} className="shrink-0 text-amber-300" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-slate-500">Vence {format(new Date(`${item.due_date}T12:00:00`), "d MMM", { locale: es })}</p></div>
                <span className="text-sm font-semibold">{money.format(item.amount)}</span>
              </div>
            ))}
          </div>
        ) : <div className="flex items-center gap-2 py-3 text-sm text-slate-500"><CheckCircle2 size={18} className="text-emerald-400" /> No tenés vencimientos próximos.</div>}
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold">Últimos movimientos</h2><p className="text-sm text-slate-500">Tu actividad más reciente</p></div><Link to="/movimientos" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">Ver todos</Link></div>
          {isLoading ? <p className="py-12 text-center text-slate-500">Cargando…</p> : data.length ? (
            <div className="space-y-2">{data.slice(0, 6).map((item) => <TransactionRow key={item.id} item={item} />)}</div>
          ) : <Empty onAdd={() => setShowForm(true)} />}
        </div>
        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-bold">Distribución de gastos</h2><p className="text-sm text-slate-500">Por categoría</p>
          <Categories items={data.filter((item) => item.type === "expense")} />
        </div>
      </section>
      {showForm && <TransactionForm onSubmit={save} onClose={() => setShowForm(false)} saving={create.isPending} />}
    </>
  );
}

function Metric({ title, value, icon: Icon, tone }) {
  const colors = { emerald: "bg-emerald-400/10 text-emerald-300", sky: "bg-sky-400/10 text-sky-300", rose: "bg-rose-400/10 text-rose-300" };
  return <article className="panel p-5"><div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${colors[tone]}`}><Icon size={21} /></div><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-2xl font-bold">{money.format(value)}</p></article>;
}

function TransactionRow({ item }) {
  const income = item.type === "income";
  return <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[.035]"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${income ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{income ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.description}</p><p className="text-xs text-slate-500">{item.category} · {format(new Date(`${item.occurred_at}T12:00:00`), "d MMM", { locale: es })}</p></div><span className={`font-semibold ${income ? "text-emerald-300" : "text-slate-200"}`}>{income ? "+" : "−"}{money.format(item.amount)}</span></div>;
}

function Empty({ onAdd }) {
  return <div className="grid place-items-center py-12 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-slate-500"><ReceiptText /></span><p className="mt-4 font-semibold">Todavía no hay movimientos</p><button onClick={onAdd} className="mt-2 text-sm text-emerald-300">Cargar el primero</button></div>;
}

function Categories({ items }) {
  const grouped = Object.entries(items.reduce((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + Number(item.amount) }), {})).sort((a, b) => b[1] - a[1]);
  const total = grouped.reduce((sum, [, value]) => sum + value, 0);
  if (!items.length) return <p className="py-14 text-center text-sm text-slate-500">Sin gastos para analizar.</p>;
  return <div className="mt-6 space-y-5">{grouped.slice(0, 5).map(([category, value]) => <div key={category}><div className="mb-2 flex justify-between text-sm"><span>{category}</span><span className="text-slate-400">{money.format(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${(value / total) * 100}%` }} /></div></div>)}</div>;
}
