import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCategories } from "../hooks/useCategories";

const initial = {
  type: "expense",
  amount: "",
  description: "",
  category: "Otros",
  occurred_at: new Date().toISOString().slice(0, 10),
  due_date: "",
  status: "paid",
};

export default function TransactionForm({ transaction, onSubmit, onClose, saving }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const { data: categoryItems = [] } = useCategories();
  const categories = categoryItems.length ? categoryItems.map((item) => item.name) : ["Otros"];

  useEffect(() => {
    setForm(transaction ? {
      ...initial,
      ...transaction,
      amount: String(transaction.amount),
      occurred_at: transaction.occurred_at.slice(0, 10),
      due_date: transaction.due_date?.slice(0, 10) || "",
    } : initial);
    setError("");
  }, [transaction]);

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setError("El monto debe ser mayor a cero.");
    if (form.description.trim().length < 2) return setError("La descripción debe tener al menos 2 caracteres.");
    if (!form.category) return setError("Seleccioná una categoría.");
    if (form.status === "pending" && !form.due_date) return setError("Indicá la fecha de vencimiento.");
    setError("");
    onSubmit({
      ...form,
      amount,
      description: form.description.trim(),
      due_date: form.due_date || null,
    }).catch((submitError) => setError(submitError.message));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="panel w-full max-w-lg bg-slate-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{transaction ? "Editar movimiento" : "Nuevo movimiento"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["income", "expense"].map((type) => (
            <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`rounded-xl border px-4 py-3 font-medium ${form.type === type ? (type === "income" ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-rose-400 bg-rose-400/10 text-rose-300") : "border-white/10 text-slate-400"}`}>
              {type === "income" ? "Ingreso" : "Gasto"}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          <input className="field" type="number" min="0.01" step="0.01" required placeholder="Monto" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className="field" required maxLength="120" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <input className="field" type="date" required value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="paid">Realizado</option>
              <option value="pending">Pendiente</option>
            </select>
            <input className="field" type="date" aria-label="Fecha de vencimiento" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} disabled={form.status === "paid"} />
          </div>
        </div>
        {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={saving}>{saving ? "Guardando…" : "Guardar movimiento"}</button>
      </form>
    </div>
  );
}
