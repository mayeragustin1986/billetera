import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useCategories } from "../hooks/useCategories";

const colors = ["#34d399", "#38bdf8", "#fb7185", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#94a3b8"];

export default function CategoriesPage() {
  const { data = [], isLoading, error, create, update, remove } = useCategories();
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) return setFormError("Ingresá al menos 2 caracteres.");
    if (data.some((item) => item.name.toLowerCase() === cleanName.toLowerCase() && item.id !== editing?.id)) {
      return setFormError("Ese nombre ya está en la lista.");
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, name: cleanName, color });
      else await create.mutateAsync({ name: cleanName, color });
      setName(""); setColor(colors[0]); setEditing(null); setFormError("");
    } catch (mutationError) {
      setFormError(mutationError.message);
    }
  };

  const startEdit = (item) => {
    setEditing(item); setName(item.name); setColor(item.color); setFormError("");
  };

  return (
    <>
      <div className="py-6 sm:py-10">
        <p className="text-lg font-semibold text-[#8e8e93]">A tu manera</p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-.04em] sm:text-7xl">Ordenar</h1>
        <p className="mt-5 max-w-xl text-xl leading-relaxed text-[#8e8e93]">Creá nombres simples para saber en qué usás tu plata.</p>
      </div>
      <section className="mt-8 grid gap-8 lg:grid-cols-[390px_1fr]">
        <form onSubmit={submit} className="panel h-fit p-7">
          <h2 className="text-2xl font-bold">{editing ? "Cambiar nombre" : "Agregar un nombre"}</h2>
          <input className="field mt-6" maxLength="40" placeholder="Ej: Comida" value={name} onChange={(event) => setName(event.target.value)} />
          <p className="mt-7 text-lg font-semibold text-[#8e8e93]">Elegí un color</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((item) => (
              <button key={item} type="button" onClick={() => setColor(item)} className="grid h-12 w-12 place-items-center rounded-full transition hover:scale-110" style={{ backgroundColor: item }} aria-label={`Color ${item}`}>
                {color === item && <Check size={17} className="text-slate-950" />}
              </button>
            ))}
          </div>
          {formError && <p className="mt-5 rounded-2xl bg-[#ff453a]/10 p-4 text-[#ff6961]">{formError}</p>}
          <div className="mt-6 flex gap-2">
            <button className="btn-primary flex-1" disabled={create.isPending || update.isPending}>{editing ? <Check size={18} /> : <Plus size={18} />}{editing ? "Guardar" : "Agregar"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setName(""); setFormError(""); }} className="grid min-h-16 w-16 place-items-center rounded-2xl border border-white/10 text-[#8e8e93] hover:text-white"><X /></button>}
          </div>
        </form>
        <div className="panel overflow-hidden">
          {error && <p className="p-7 text-[#ffb340]">No pudimos mostrar la lista.</p>}
          {isLoading ? <p className="p-14 text-center text-[#8e8e93]">Un momento…</p> : data.length ? (
            <div className="divide-y divide-white/[0.07] px-5">
              {data.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-5 sm:px-2">
                  <span className="grid h-13 w-13 place-items-center rounded-2xl" style={{ backgroundColor: `${item.color}20`, color: item.color }}><Tags size={22} /></span>
                  <p className="min-w-0 flex-1 truncate text-lg font-semibold">{item.name}</p>
                  <button onClick={() => startEdit(item)} className="grid h-12 w-12 place-items-center rounded-full text-[#8e8e93] hover:bg-white/5 hover:text-white" aria-label="Cambiar"><Pencil size={20} /></button>
                  <button onClick={() => window.confirm("¿Querés borrar este nombre?") && remove.mutate(item.id)} className="grid h-12 w-12 place-items-center rounded-full text-[#8e8e93] hover:bg-[#ff453a]/10 hover:text-[#ff6961]" aria-label="Borrar"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          ) : <p className="p-14 text-center text-[#8e8e93]">Agregá un nombre para empezar.</p>}
        </div>
      </section>
    </>
  );
}
