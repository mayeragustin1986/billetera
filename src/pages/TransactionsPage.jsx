import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TransactionForm from "../components/TransactionForm";
import { useTransactions } from "../hooks/useTransactions";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function TransactionsPage() {
  const { data = [], isLoading, error, create, update, remove } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => data.filter((item) => {
    const matchesType = type === "all" || item.type === type;
    const term = search.toLowerCase();
    return matchesType && (`${item.description} ${item.category}`).toLowerCase().includes(term);
  }), [data, search, type]);

  const save = async (values) => {
    if (editing) await update.mutateAsync({ id: editing.id, ...values });
    else await create.mutateAsync(values);
    setEditing(null); setFormOpen(false);
  };

  const deleteItem = (id) => {
    if (window.confirm("¿Eliminar este movimiento?")) remove.mutate(id);
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm text-emerald-300">Historial financiero</p><h1 className="mt-1 text-3xl font-bold">Movimientos</h1><p className="mt-2 text-slate-500">Gestioná todos tus ingresos y gastos.</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary"><Plus size={19} /> Nuevo movimiento</button>
      </div>
      <div className="panel mt-8 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} /><input className="field pl-11" placeholder="Buscar por descripción o categoría" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <select className="field sm:w-48" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Todos</option><option value="income">Ingresos</option><option value="expense">Gastos</option></select>
        </div>
      </div>
      {error && <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">No se pudo acceder a la tabla de movimientos.</p>}
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
