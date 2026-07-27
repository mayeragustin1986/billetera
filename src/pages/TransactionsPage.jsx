import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TransactionForm from "../components/TransactionForm";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function TransactionsPage() {
  const { data = [], isLoading, error, create, update, remove } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(() => data.filter((item) => {
    const matchesType = type === "all" || item.type === type;
    const matchesCategory = category === "all" || item.category === category;
    const matchesFrom = !dateFrom || item.occurred_at >= dateFrom;
    const matchesTo = !dateTo || item.occurred_at <= dateTo;
    const term = search.toLowerCase();
    return matchesType && matchesCategory && matchesFrom && matchesTo
      && (`${item.description} ${item.category}`).toLowerCase().includes(term);
  }), [category, data, dateFrom, dateTo, search, type]);

  const save = async (values) => {
    setActionError("");
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...values });
      else await create.mutateAsync(values);
      setEditing(null); setFormOpen(false);
    } catch (mutationError) {
      setActionError(mutationError.message);
      throw mutationError;
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("¿Querés borrar esto?")) return;
    setActionError("");
    try {
      await remove.mutateAsync(id);
    } catch (mutationError) {
      setActionError(mutationError.message);
    }
  };

  const clearFilters = () => {
    setSearch(""); setType("all"); setCategory("all"); setDateFrom(""); setDateTo("");
  };
  const hasFilters = search || type !== "all" || category !== "all" || dateFrom || dateTo;

  return (
    <>
      <div className="py-6 sm:py-10">
        <p className="text-lg font-semibold text-[#8e8e93]">Todo en un lugar</p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-.04em] sm:text-7xl">Mi plata</h1>
      </div>
      <div className="panel mt-8 p-5 sm:p-7">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_190px_160px_160px_auto]">
          <label className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8e8e93]" size={21} /><input className="field pl-13" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <select className="field" aria-label="Cobré o pagué" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Todo</option><option value="income">Cobré</option><option value="expense">Pagué</option></select>
          <select className="field" aria-label="Para qué" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Para cualquier cosa</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
          <input className="field" type="date" aria-label="Desde" title="Desde" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
          <input className="field" type="date" aria-label="Hasta" title="Hasta" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
          <button onClick={clearFilters} disabled={!hasFilters} className="grid min-h-16 place-items-center rounded-2xl border border-white/10 px-4 text-[#8e8e93] hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Limpiar" title="Limpiar"><RotateCcw size={21} /></button>
        </div>
      </div>
      {error && <p className="mt-6 rounded-2xl bg-[#ff9f0a]/10 p-5 text-lg text-[#ffb340]">No pudimos mostrar tu plata. Probá de nuevo.</p>}
      {actionError && <p className="mt-6 rounded-2xl bg-[#ff453a]/10 p-5 text-lg text-[#ff6961]">No pudimos hacer eso. Probá otra vez.</p>}
      <div className="panel mt-8 overflow-hidden px-5 sm:px-7">
        {isLoading ? <p className="p-14 text-center text-lg text-[#8e8e93]">Un momento…</p> : filtered.length ? (
          <div className="divide-y divide-white/[0.07]">
            {filtered.map((item) => {
              const income = item.type === "income";
              return <div key={item.id} className="group flex items-center gap-4 py-6">
                <span className={`grid h-13 w-13 shrink-0 place-items-center rounded-full ${income ? "bg-[#30d158]/15 text-[#30d158]" : "bg-white/[0.06] text-white"}`}>{income ? <ArrowDown /> : <ArrowUp />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold">{item.description}</p><p className="mt-1 text-sm text-[#8e8e93]">{item.category} · {format(new Date(`${item.occurred_at}T12:00:00`), "d MMM yyyy", { locale: es })}</p><p className={`mt-2 font-bold sm:hidden ${income ? "text-[#30d158]" : "text-white"}`}>{income ? "+" : "−"}{money.format(item.amount)}</p></div>
                <p className={`hidden text-lg font-bold sm:block ${income ? "text-[#30d158]" : "text-white"}`}>{income ? "+" : "−"}{money.format(item.amount)}</p>
                <div className="flex">
                  <button onClick={() => { setEditing(item); setFormOpen(true); }} className="grid h-12 w-12 place-items-center rounded-full text-[#8e8e93] hover:bg-white/5 hover:text-white" aria-label="Cambiar"><Pencil size={20} /></button>
                  <button onClick={() => deleteItem(item.id)} className="grid h-12 w-12 place-items-center rounded-full text-[#8e8e93] hover:bg-[#ff453a]/10 hover:text-[#ff6961]" aria-label="Borrar"><Trash2 size={20} /></button>
                </div>
              </div>;
            })}
          </div>
        ) : <div className="p-14 text-center"><p className="text-xl font-semibold">No encontramos nada.</p><p className="mt-2 text-[#8e8e93]">Probá cambiando la búsqueda.</p></div>}
      </div>
      {formOpen && <TransactionForm transaction={editing} onSubmit={save} onClose={() => { setFormOpen(false); setEditing(null); }} saving={create.isPending || update.isPending} />}
    </>
  );
}
