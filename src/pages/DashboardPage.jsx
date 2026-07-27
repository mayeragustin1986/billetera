import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useTransactions } from "../hooks/useTransactions";
import TransactionForm from "../components/TransactionForm";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { data = [], isLoading, error, create } = useTransactions();
  const [formType, setFormType] = useState(null);
  const totals = useMemo(() => data.reduce((sum, item) => {
    if (item.status === "paid") sum[item.type] += Number(item.amount);
    return sum;
  }, { income: 0, expense: 0 }), [data]);
  const monthly = useMemo(() => {
    const now = new Date();
    return data.reduce((sum, item) => {
      const date = new Date(`${item.occurred_at}T12:00:00`);
      if (item.status === "paid" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) sum[item.type] += Number(item.amount);
      return sum;
    }, { income: 0, expense: 0 });
  }, [data]);
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.filter((item) => item.status === "pending" && item.due_date && item.due_date >= today).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 3);
  }, [data]);

  const save = async (values) => {
    await create.mutateAsync(values);
    setFormType(null);
  };

  return (
    <>
      <section className="py-8 text-center sm:py-14">
        <p className="text-xl font-semibold text-[#8e8e93]">Tengo</p>
        <h1 className="mt-3 text-6xl font-bold tracking-[-.06em] sm:text-8xl">{isLoading ? "—" : money.format(totals.income - totals.expense)}</h1>
        <p className="mt-5 text-lg text-[#8e8e93]">disponibles hoy</p>
        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
          <button onClick={() => setFormType("income")} className="flex min-h-24 items-center justify-center gap-4 rounded-[1.7rem] bg-[#30d158] text-2xl font-bold text-black transition active:scale-[.98]"><ArrowDown size={30} strokeWidth={2.5} /> Cobré</button>
          <button onClick={() => setFormType("expense")} className="flex min-h-24 items-center justify-center gap-4 rounded-[1.7rem] bg-[#ff453a] text-2xl font-bold text-white transition active:scale-[.98]"><ArrowUp size={30} strokeWidth={2.5} /> Pagué</button>
        </div>
      </section>
      {error && <p className="mx-auto mt-6 max-w-2xl rounded-2xl bg-[#ff9f0a]/10 p-5 text-center text-lg text-[#ffb340]">No pudimos mostrar tu plata. Probá de nuevo en un momento.</p>}
      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <article className="panel p-7 sm:p-9"><p className="text-lg text-[#8e8e93]">Cobré este mes</p><p className="mt-3 text-4xl font-bold tracking-tight text-[#30d158]">{money.format(monthly.income)}</p></article>
        <article className="panel p-7 sm:p-9"><p className="text-lg text-[#8e8e93]">Pagué este mes</p><p className="mt-3 text-4xl font-bold tracking-tight">{money.format(monthly.expense)}</p></article>
      </section>
      <section className="panel mt-8 p-7 sm:p-9">
        <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ff9f0a]/15 text-[#ff9f0a]"><CalendarClock size={27} /></span><div><h2 className="text-2xl font-bold">Próximo pago</h2><p className="mt-1 text-[#8e8e93]">Lo que falta pagar</p></div></div>
        {upcoming.length ? <div className="mt-7 divide-y divide-white/[0.07]">{upcoming.map((item) => <div key={item.id} className="flex items-center gap-4 py-5"><div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold">{item.description}</p><p className="mt-1 text-[#8e8e93]">{format(new Date(`${item.due_date}T12:00:00`), "d 'de' MMMM", { locale: es })}</p></div><p className="text-xl font-bold">{money.format(item.amount)}</p></div>)}</div> : <div className="mt-8 flex items-center gap-3 text-lg text-[#8e8e93]"><CheckCircle2 className="text-[#30d158]" /> No debés nada por ahora.</div>}
      </section>
      <section className="mt-14">
        <div className="flex items-center justify-between"><h2 className="text-3xl font-bold tracking-tight">Lo último</h2><Link to="/movimientos" className="flex min-h-12 items-center gap-1 text-lg font-semibold text-[#0a84ff]">Ver todo <ArrowRight /></Link></div>
        {data.length ? <div className="panel mt-6 divide-y divide-white/[0.07] px-6">{data.slice(0, 5).map((item) => <MoneyRow key={item.id} item={item} />)}</div> : <div className="panel mt-6 p-12 text-center"><p className="text-xl font-semibold">Todavía no anotaste nada.</p><p className="mt-2 text-[#8e8e93]">Usá “Cobré” o “Pagué” para empezar.</p></div>}
      </section>
      {formType && <TransactionForm initialType={formType} onSubmit={save} onClose={() => setFormType(null)} saving={create.isPending} />}
    </>
  );
}

function MoneyRow({ item }) {
  const income = item.type === "income";
  return <div className="flex items-center gap-4 py-5"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${income ? "bg-[#30d158]/15 text-[#30d158]" : "bg-white/[0.06] text-white"}`}>{income ? <ArrowDown /> : <ArrowUp />}</span><div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold">{item.description}</p><p className="mt-1 text-sm text-[#8e8e93]">{item.category}</p></div><p className={`text-lg font-bold ${income ? "text-[#30d158]" : "text-white"}`}>{income ? "+" : "−"}{money.format(item.amount)}</p></div>;
}
