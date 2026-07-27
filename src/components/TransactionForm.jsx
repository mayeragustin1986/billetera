import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useCategories } from "../hooks/useCategories";

const initial = {
  type: "expense", amount: "", description: "", category: "Otros",
  occurred_at: new Date().toISOString().slice(0, 10), due_date: "", status: "paid",
};

export default function TransactionForm({ transaction, onSubmit, onClose, saving, initialType }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const { data: savedGroups = [] } = useCategories();
  const groups = savedGroups.length ? savedGroups.map((item) => item.name) : ["Otros"];

  useEffect(() => {
    setForm(transaction ? {
      ...initial, ...transaction, amount: String(transaction.amount),
      occurred_at: transaction.occurred_at.slice(0, 10),
      due_date: transaction.due_date?.slice(0, 10) || "",
    } : { ...initial, type: initialType || "expense" });
    setError("");
  }, [initialType, transaction]);

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setError("Escribí un importe mayor a cero.");
    if (form.description.trim().length < 2) return setError("Contanos brevemente de qué se trata.");
    if (!form.category) return setError("Elegí para qué fue.");
    if (form.status === "pending" && !form.due_date) return setError("Elegí cuándo vence.");
    setError("");
    onSubmit({ ...form, amount, description: form.description.trim(), due_date: form.due_date || null })
      .catch(() => setError("No pudimos guardar. Probá otra vez."));
  };

  const isIncome = form.type === "income";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#08090a]">
      <form onSubmit={submit} className="mx-auto min-h-screen max-w-2xl px-5 py-8 sm:px-10 sm:py-14">
        <button type="button" onClick={onClose} className="flex min-h-12 items-center gap-2 text-lg text-[#0a84ff]"><ArrowLeft /> Volver</button>
        <p className="mt-12 text-lg font-semibold text-[#8e8e93]">{transaction ? "Cambiar" : "Anotar"}</p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-.04em] sm:text-7xl">{isIncome ? "Cobré" : "Pagué"}</h1>
        <div className="mt-12 grid grid-cols-2 gap-3 rounded-[1.4rem] bg-[#1c1c1e] p-2">
          <button type="button" onClick={() => setForm({ ...form, type: "income", status: "paid" })} className={`min-h-14 rounded-2xl text-lg font-bold ${isIncome ? "bg-white text-black" : "text-[#8e8e93]"}`}>Cobré</button>
          <button type="button" onClick={() => setForm({ ...form, type: "expense" })} className={`min-h-14 rounded-2xl text-lg font-bold ${!isIncome ? "bg-white text-black" : "text-[#8e8e93]"}`}>Pagué</button>
        </div>
        <div className="mt-8 space-y-5">
          <label className="block"><span className="mb-2 block text-lg font-semibold">¿Cuánto?</span><input autoFocus className="field text-3xl font-bold" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder="$ 0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block"><span className="mb-2 block text-lg font-semibold">¿Qué fue?</span><input className="field" required maxLength="120" placeholder="Ej: Supermercado" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="block"><span className="mb-2 block text-lg font-semibold">¿Para qué?</span><select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{groups.map((group) => <option key={group}>{group}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-lg font-semibold">¿Cuándo?</span><input className="field" type="date" required value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} /></label>
          {!isIncome && <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setForm({ ...form, status: "paid", due_date: "" })} className={`min-h-16 rounded-2xl border text-lg font-semibold ${form.status === "paid" ? "border-white bg-white text-black" : "border-white/10 text-[#8e8e93]"}`}>Ya pagué</button><button type="button" onClick={() => setForm({ ...form, status: "pending" })} className={`min-h-16 rounded-2xl border text-lg font-semibold ${form.status === "pending" ? "border-[#ff9f0a] bg-[#ff9f0a] text-black" : "border-white/10 text-[#8e8e93]"}`}>Lo debo</button></div>}
          {form.status === "pending" && <label className="block"><span className="mb-2 block text-lg font-semibold">¿Cuándo vence?</span><input className="field" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>}
        </div>
        {error && <p className="mt-6 rounded-2xl bg-[#ff453a]/10 p-5 text-lg text-[#ff6961]">{error}</p>}
        <button className="btn-primary mt-10 w-full" disabled={saving}><Check size={23} />{saving ? "Guardando…" : "Listo"}</button>
      </form>
    </div>
  );
}
