import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTransactions } from "../hooks/useTransactions";
import { useAccounts, useFinancialSpaces } from "../hooks/useFinancialEntities";
import { groupPaymentsByDueDate } from "../utils/paymentAgenda";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const displayDate = (date) => format(new Date(`${date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es });

export default function PaymentAgendaPage() {
  const { data = [], isLoading, error } = useTransactions();
  const { data: spaces = [] } = useFinancialSpaces();
  const { data: accounts = [] } = useAccounts();
  const [spaceId, setSpaceId] = useState("all");
  const [accountId, setAccountId] = useState("all");

  const groups = useMemo(() => groupPaymentsByDueDate(data.filter((item) =>
    (spaceId === "all" || item.space_id === spaceId)
    && (accountId === "all" || item.account_id === accountId)
  )), [accountId, data, spaceId]);
  const accountNames = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);

  return <>
    <div className="py-6 sm:py-10">
      <p className="text-lg font-semibold text-[#8e8e93]">Todo lo que falta pagar</p>
      <h1 className="mt-2 text-5xl font-bold tracking-[-.04em] sm:text-7xl">Agenda de Pagos</h1>
    </div>
    <div className="panel mt-8 grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
      <select className="field" aria-label="Espacio financiero" value={spaceId} onChange={(event) => setSpaceId(event.target.value)}><option value="all">Todos los espacios</option>{spaces.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select className="field" aria-label="Cuenta" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="all">Todas las cuentas</option>{accounts.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </div>
    {error && <p className="mt-6 rounded-2xl bg-[#ff9f0a]/10 p-5 text-[#ffb340]">No pudimos mostrar tus pagos. Probá de nuevo.</p>}
    {isLoading ? <div className="panel mt-8 p-14 text-center text-lg text-[#8e8e93]">Un momento…</div> : groups.length ? (
      <div className="mt-8 space-y-5">{groups.map((group) => <section className="panel overflow-hidden" key={group.date}>
        <header className="flex flex-col gap-2 border-b border-white/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-3"><CalendarClock className="text-[#ff9f0a]" /><h2 className="text-xl font-bold capitalize">{displayDate(group.date)}</h2></div>
          <p className="text-2xl font-bold">{money.format(group.total)}</p>
        </header>
        <div className="divide-y divide-white/[0.07] px-6 sm:px-7">{group.payments.map((payment) => <article className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center" key={payment.id}>
          <div className="min-w-0"><p className="truncate text-lg font-semibold">{payment.description}</p><p className="mt-1 text-sm text-[#8e8e93]">{payment.category} · {accountNames.get(payment.account_id) || "Cuenta no disponible"}</p></div>
          <p className="text-lg font-bold">{money.format(payment.amount)}</p>
        </article>)}</div>
      </section>)}</div>
    ) : <div className="panel mt-8 p-14 text-center"><CheckCircle2 className="mx-auto text-[#30d158]" size={36} /><p className="mt-4 text-xl font-semibold">No debés nada por ahora.</p><p className="mt-2 text-[#8e8e93]">Tus próximos pagos van a aparecer acá.</p></div>}
  </>;
}
