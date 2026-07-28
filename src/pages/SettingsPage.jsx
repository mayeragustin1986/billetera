import { Check, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAccounts, useFinancialSpaces } from "../hooks/useFinancialEntities";

const colors = ["#0a84ff", "#30d158", "#af52de", "#ff9500", "#ff453a", "#00b1ea"];
const types = [["cash", "Efectivo"], ["bank", "Banco"], ["virtual_wallet", "Billetera virtual"], ["prepaid", "Prepaga"], ["other", "Otra"]];

export default function SettingsPage() {
  const [tab, setTab] = useState("spaces");
  return <><div className="py-6 sm:py-10"><p className="text-lg font-semibold text-[#8e8e93]">Todo a tu manera</p><h1 className="mt-2 text-5xl font-bold sm:text-7xl">Configuración</h1></div><div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#1c1c1e] p-2"><Tab active={tab === "spaces"} onClick={() => setTab("spaces")}>Espacios</Tab><Tab active={tab === "accounts"} onClick={() => setTab("accounts")}>Cuentas</Tab></div><Manager key={tab} kind={tab} /></>;
}

function Tab({ active, children, onClick }) {
  return <button onClick={onClick} className={`min-h-14 rounded-xl text-lg font-bold ${active ? "bg-white text-black" : "text-[#8e8e93]"}`}>{children}</button>;
}

function Manager({ kind }) {
  const spaces = useFinancialSpaces();
  const accounts = useAccounts();
  const api = kind === "spaces" ? spaces : accounts;
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", color: colors[0], type: "other" });
  const [error, setError] = useState("");
  const reset = () => { setEditing(null); setForm({ name: "", color: colors[0], type: "other" }); setError(""); };
  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError("Escribí un nombre.");
    const values = { name: form.name.trim(), color: form.color, ...(kind === "accounts" ? { type: form.type } : {}) };
    try { if (editing) await api.update.mutateAsync({ id: editing.id, ...values }); else await api.create.mutateAsync(values); reset(); } catch (err) { setError(err.message); }
  };
  const edit = (item) => { setEditing(item); setForm({ name: item.name, color: item.color, type: item.type || "other" }); };
  const toggle = async (item) => { try { await api.update.mutateAsync({ id: item.id, active: !item.active }); } catch (err) { setError(err.message); } };
  const remove = async (item) => { if (!window.confirm(`¿Borrar ${item.name}?`)) return; try { await api.remove.mutateAsync(item.id); } catch (err) { setError(err.message); } };
  return <section className="mt-8 grid gap-8 lg:grid-cols-[390px_1fr]"><form onSubmit={submit} className="panel h-fit p-7"><h2 className="text-2xl font-bold">{editing ? "Cambiar" : kind === "spaces" ? "Nuevo espacio" : "Nueva cuenta"}</h2><input className="field mt-6" placeholder="Nombre" maxLength="60" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{kind === "accounts" && <select className="field mt-4" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}<div className="mt-6 flex flex-wrap gap-3">{colors.map((color) => <button key={color} type="button" onClick={() => setForm({ ...form, color })} className="grid h-11 w-11 place-items-center rounded-full" style={{ backgroundColor: color }}>{form.color === color && <Check size={18} className="text-black" />}</button>)}</div>{error && <p className="mt-5 rounded-xl bg-[#ff453a]/10 p-4 text-[#ff6961]">{error}</p>}<div className="mt-7 flex gap-3"><button className="btn-primary flex-1">{editing ? <Check /> : <Plus />}{editing ? "Guardar" : "Agregar"}</button>{editing && <button type="button" onClick={reset} className="grid w-16 place-items-center rounded-2xl border border-white/10"><X /></button>}</div></form><div className="panel overflow-hidden px-5">{api.isLoading ? <p className="p-12 text-center text-[#8e8e93]">Un momento…</p> : api.data?.map((item) => <div key={item.id} className={`flex items-center gap-3 border-b border-white/[0.07] py-5 last:border-0 ${item.active ? "" : "opacity-45"}`}><span className="h-11 w-11 rounded-xl" style={{ backgroundColor: item.color }} /><div className="min-w-0 flex-1"><p className="truncate text-lg font-bold">{item.name}</p><p className="text-sm text-[#8e8e93]">{item.active ? "Activo" : "Desactivado"}</p></div><IconButton label={item.active ? "Desactivar" : "Activar"} onClick={() => toggle(item)}><Power /></IconButton><IconButton label="Editar" onClick={() => edit(item)}><Pencil /></IconButton><IconButton label="Borrar" onClick={() => remove(item)}><Trash2 /></IconButton></div>)}</div></section>;
}

function IconButton({ label, onClick, children }) {
  return <button onClick={onClick} className="grid h-11 w-11 place-items-center rounded-full text-[#8e8e93] hover:bg-white/5 hover:text-white" aria-label={label}>{children}</button>;
}
