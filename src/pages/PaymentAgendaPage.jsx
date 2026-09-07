import { CalendarClock, CheckCircle2, CircleDollarSign, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAccounts, useFinancialSpaces } from "../hooks/useFinancialEntities";
import { useTransactions } from "../hooks/useTransactions";
import { getPaymentAgenda } from "../utils/paymentAgenda";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function PaymentAgendaPage() {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const { data: spaces = [] } = useFinancialSpaces();
  const { data: accounts = [] } = useAccounts();
  const [spaceId, setSpaceId] = useState("all");
  const [accountId, setAccountId] = useState("all");

  const filtered = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          (spaceId === "all" || transaction.space_id === spaceId) &&
          (accountId === "all" || transaction.account_id === accountId),
      ),
    [accountId, spaceId, transactions],
  );
  const agenda = useMemo(() => getPaymentAgenda(filtered), [filtered]);

  return (
    <>
      <header className="mb-8">
        <p className="font-semibold text-[#ff9f0a]">Organizá lo que viene</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Agenda de Pagos</h1>
        <p className="mt-3 max-w-2xl text-[#8e8e93]">Tus gastos pendientes, ordenados por fecha para que sepas cuánto necesitás reservar.</p>
      </header>

      <div className="panel grid gap-3 p-5 sm:grid-cols-2">
        <select className="field" value={spaceId} onChange={(event) => setSpaceId(event.target.value)} aria-label="Filtrar por espacio">
          <option value="all">Todos los espacios</option>
          {spaces.filter((space) => space.active).map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
        </select>
        <select className="field" value={accountId} onChange={(event) => setAccountId(event.target.value)} aria-label="Filtrar por cuenta">
          <option value="all">Todas las cuentas</option>
          {accounts.filter((account) => account.active).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-[#ff9f0a]/10 p-5 text-[#ffb340]">No pudimos cargar tu agenda.</p>}

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        <SummaryCard icon={CircleDollarSign} label="DEBÉS" amount={agenda.debt} color="#ff453a" loading={isLoading} />
        <SummaryCard icon={WalletCards} label="LIBRE" amount={agenda.free} color="#30d158" loading={isLoading} />
      </section>

      <section className="panel mt-8 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CalendarClock className="text-[#ff9f0a]" />
          <h2 className="text-2xl font-bold">Próximos pagos</h2>
        </div>
        {agenda.groups.length ? (
          <div className="mt-7 space-y-8">
            {agenda.groups.map((group) => (
              <div key={group.date}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#8e8e93]">
                  {format(new Date(`${group.date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <div className="divide-y divide-white/[0.07] rounded-2xl bg-white/[0.04] px-5">
                  {group.payments.map((payment) => (
                    <article key={payment.id} className="flex items-center justify-between gap-4 py-5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{payment.description}</p>
                        <p className="mt-1 text-sm text-[#8e8e93]">{accounts.find((account) => account.id === payment.account_id)?.name || "Sin cuenta"}</p>
                      </div>
                      <p className="shrink-0 text-lg font-bold">{money.format(payment.amount)}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-7 flex items-center gap-2 text-[#8e8e93]"><CheckCircle2 className="text-[#30d158]" /> No tenés pagos pendientes con vencimiento.</p>
        )}
      </section>
    </>
  );
}

function SummaryCard({ icon: Icon, label, amount, color, loading }) {
  return (
    <article className="panel p-7">
      <div className="flex items-center gap-3" style={{ color }}><Icon /><h2 className="font-bold tracking-wider">{label}</h2></div>
      <p className="mt-5 text-4xl font-bold">{loading ? "—" : money.format(amount)}</p>
    </article>
  );
}
