import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
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
    if (!window.confirm("¿Eliminar este movimiento?")) return;
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
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm text-emerald-300">Historial financiero</p><h1 className="mt-1 text-3xl font-bold">Movimientos</h1><p className="mt-2 text-slate-500">Gestioná todos tus ingresos y gastos.</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary"><Plus size={19} /> Nuevo movimiento</button>
      </div>
      <div className="panel mt-8 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_190px_160px_160px_auto]">
          <label className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} /><input className="field pl-11" placeholder="Buscar movimientos" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Todos los tipos</option><option value="income">Ingresos</option><option value="expense">Gastos</option></select>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Todas las categorías</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
          <input className="field" type="date" aria-label="Desde" title="Desde" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
          <input className="field" type="date" aria-label="Hasta" title="Hasta" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
          <button onClick={clearFilters} disabled={!hasFilters} className="grid min-h-12 place-items-center rounded-xl border border-white/10 px-4 text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Limpiar filtros" title="Limpiar filtros"><RotateCcw size={19} /></button>
        </div>
        <p className="mt-3 text-xs text-slate-500">{filtered.length} de {data.length} movimientos</p>
      </div>
      {error && <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">No se pudo acceder a la tabla de movimientos.</p>}
      {actionError && <p className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{actionError}</p>}
      <div className="panel mt-6 overflow-hidden">
        {isLoading ? <p className="p-12 text-center text-slate-500">Cargando…</p> : filtered.length ? (
          <div className="divide-y divide-white/5">
            {filtered.map((item) => {
              const income = item.type === "income";
              return <div key={item.id} className="group flex items-center gap-3 p-4 sm:px-6">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${income ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{income ? <ArrowUpRight /> : <ArrowDownRight />}</span>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.description}</p><p className="text-xs text-slate-500">{item.category} · {format(new Date(`${item.occurred_at}T12:00:00`), "d 'de' MMMM, yyyy", { locale: es })}</p></div>
                <p className={`hidden font-semibold sm:block ${income ? "text-emerald-300" : "text-slate-100"}`}>{income ? "+" : "−"}{money.format(item.amount)}</p>
                <div className="flex">
                  <button onClick={() => { setEditing(item); setFormOpen(true); }} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Editar"><Pencil size={17} /></button>
                  <button onClick={() => deleteItem(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-400/10 hover:text-red-300" aria-label="Eliminar"><Trash2 size={17} /></button>
                </div>
              </div>;
            })}
          </div>
        ) : <p className="p-12 text-center text-slate-500">No hay movimientos que coincidan.</p>}
      </div>
      {formOpen && <TransactionForm transaction={editing} onSubmit={save} onClose={() => { setFormOpen(false); setEditing(null); }} saving={create.isPending || update.isPending} />}
    </>
  );
}
