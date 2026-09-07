import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, CheckCircle2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTransactions } from "../hooks/useTransactions";
import { useAccounts, useFinancialSpaces } from "../hooks/useFinancialEntities";
import TransactionForm from "../components/TransactionForm";
import { groupPaymentsByDueDate, getPendingPayments } from "../utils/paymentAgenda";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const empty = () => ({ income: 0, expense: 0 });

export default function DashboardPage() {
  const { data = [], isLoading, error, create } = useTransactions();
  const { data: spaces = [] } = useFinancialSpaces();
  const { data: accounts = [] } = useAccounts();
  const [spaceId, setSpaceId] = useState("all");
  const [accountId, setAccountId] = useState("all");
  const [formType, setFormType] = useState(null);
  const filtered = useMemo(() => data.filter((item) => (spaceId === "all" || item.space_id === spaceId) && (accountId === "all" || item.account_id === accountId)), [accountId, data, spaceId]);
  const totalsBySpace = useMemo(() => {
    const result = new Map();
    for (const item of data) {
      if (item.status !== "paid" || (accountId !== "all" && item.account_id !== accountId)) continue;
      const value = result.get(item.space_id) || empty();
      value[item.type] += Number(item.amount);
      result.set(item.space_id, value);
    }
    return result;
  }, [accountId, data]);
  const consolidated = useMemo(() => [...totalsBySpace.values()].reduce((sum, value) => ({ income: sum.income + value.income, expense: sum.expense + value.expense }), empty()), [totalsBySpace]);
  const accountTotals = useMemo(() => accounts.filter((item) => item.active).map((account) => {
    const amount = data.filter((item) => item.account_id === account.id && item.status === "paid" && (spaceId === "all" || item.space_id === spaceId)).reduce((sum, item) => sum + (item.type === "income" ? Number(item.amount) : -Number(item.amount)), 0);
    return { ...account, amount };
  }), [accounts, data, spaceId]);
  const pending = useMemo(() => getPendingPayments(filtered), [filtered]);
  const owed = useMemo(() => pending.reduce((sum, item) => sum + Number(item.amount), 0), [pending]);
  const upcoming = useMemo(() => groupPaymentsByDueDate(filtered).slice(0, 3), [filtered]);
  const available = consolidated.income - consolidated.expense;
  const save = async (values) => { await create.mutateAsync(values); setFormType(null); };
  const namedSpace = (name) => spaces.find((item) => item.name.toLowerCase() === name.toLowerCase());
  const personal = namedSpace("Personal");
  const mintha = namedSpace("Mintha");

  return <>
    <section className="py-8 text-center sm:py-12"><p className="text-xl font-semibold text-[#8e8e93]">Tengo</p><h1 className="mt-3 text-6xl font-bold tracking-[-.06em] sm:text-8xl">{isLoading ? "—" : money.format(available)}</h1><div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2"><button onClick={() => setFormType("income")} className="flex min-h-24 items-center justify-center gap-4 rounded-[1.7rem] bg-[#30d158] text-2xl font-bold text-black"><ArrowDown size={30} /> Cobré</button><button onClick={() => setFormType("expense")} className="flex min-h-24 items-center justify-center gap-4 rounded-[1.7rem] bg-[#ff453a] text-2xl font-bold"><ArrowUp size={30} /> Pagué</button></div></section>
    <div className="panel grid gap-3 p-5 sm:grid-cols-2"><select className="field" value={spaceId} onChange={(e) => setSpaceId(e.target.value)}><option value="all">Todos los espacios</option>{spaces.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="all">Todas las cuentas</option>{accounts.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    {error && <p className="mt-6 rounded-2xl bg-[#ff9f0a]/10 p-5 text-[#ffb340]">No pudimos mostrar tu plata.</p>}
    <section className="mt-8 grid gap-5 lg:grid-cols-3"><SpaceCard title="Personal" totals={totalsBySpace.get(personal?.id) || empty()} color={personal?.color} /><SpaceCard title="Mintha" totals={totalsBySpace.get(mintha?.id) || empty()} color={mintha?.color} /><SpaceCard title="Total" totals={consolidated} color="#30d158" /></section>
    <section className="mt-8 grid gap-5 sm:grid-cols-2"><SummaryCard title="DEBÉS" amount={owed} color="#ff9f0a" /><SummaryCard title="LIBRE" amount={available - owed} color="#0a84ff" /></section>
    <section className="panel mt-8 p-7"><div className="flex items-center gap-4"><Wallet className="text-[#30d158]" size={28} /><h2 className="text-2xl font-bold">¿Dónde está tu dinero?</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{accountTotals.map((item) => <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-5"><span className="h-11 w-11 rounded-xl" style={{ backgroundColor: item.color }} /><p className="min-w-0 flex-1 truncate font-semibold">{item.name}</p><p className="text-lg font-bold">{money.format(item.amount)}</p></div>)}</div></section>
    <section className="panel mt-8 p-7"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><CalendarClock className="text-[#ff9f0a]" /><h2 className="text-2xl font-bold">Próximos pagos</h2></div><Link to="/agenda-pagos" className="flex min-h-11 items-center gap-1 rounded-full px-3 font-semibold text-[#0a84ff] hover:bg-white/5">Ver todas <ArrowRight size={18} /></Link></div>{upcoming.length ? <div className="mt-5 divide-y divide-white/[0.07]">{upcoming.map((group) => <div key={group.date} className="flex items-center justify-between gap-4 py-4"><p className="font-semibold capitalize">{format(new Date(`${group.date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}</p><p className="font-bold">{money.format(group.total)}</p></div>)}</div> : <p className="mt-6 flex items-center gap-2 text-[#8e8e93]"><CheckCircle2 className="text-[#30d158]" /> No debés nada por ahora.</p>}</section>
    {formType && <TransactionForm initialType={formType} onSubmit={save} onClose={() => setFormType(null)} saving={create.isPending} />}
  </>;
}

function SummaryCard({ title, amount, color }) {
  return <article className="panel p-7"><p className="text-sm font-bold tracking-[.18em] text-[#8e8e93]">{title}</p><p className="mt-4 text-4xl font-bold" style={{ color }}>{money.format(amount)}</p></article>;
}

function SpaceCard({ title, totals, color }) {
  return <article className="panel p-7"><div className="mb-5 h-2 w-14 rounded-full" style={{ backgroundColor: color || "#8e8e93" }} /><h2 className="text-2xl font-bold">{title}</h2><p className="mt-5 text-4xl font-bold">{money.format(totals.income - totals.expense)}</p><div className="mt-5 flex justify-between text-sm text-[#8e8e93]"><span>Cobré {money.format(totals.income)}</span><span>Pagué {money.format(totals.expense)}</span></div></article>;
}
