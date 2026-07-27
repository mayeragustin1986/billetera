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
      return setFormError("Ya existe una categoría con ese nombre.");
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
      <div>
        <p className="text-sm text-emerald-300">Organización</p>
        <h1 className="mt-1 text-3xl font-bold">Categorías</h1>
        <p className="mt-2 text-slate-500">Personalizá cómo agrupás tus movimientos.</p>
      </div>
      <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="panel h-fit p-5">
          <h2 className="font-bold">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
          <input className="field mt-5" maxLength="40" placeholder="Nombre" value={name} onChange={(event) => setName(event.target.value)} />
          <p className="mt-5 text-sm text-slate-400">Color</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((item) => (
              <button key={item} type="button" onClick={() => setColor(item)} className="grid h-9 w-9 place-items-center rounded-full transition hover:scale-110" style={{ backgroundColor: item }} aria-label={`Color ${item}`}>
                {color === item && <Check size={17} className="text-slate-950" />}
              </button>
            ))}
          </div>
          {formError && <p className="mt-4 text-sm text-rose-300">{formError}</p>}
          <div className="mt-6 flex gap-2">
            <button className="btn-primary flex-1" disabled={create.isPending || update.isPending}>{editing ? <Check size={18} /> : <Plus size={18} />}{editing ? "Guardar" : "Agregar"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setName(""); setFormError(""); }} className="rounded-xl border border-white/10 px-4 text-slate-400 hover:text-white"><X /></button>}
          </div>
        </form>
        <div className="panel overflow-hidden">
          {error && <p className="p-6 text-amber-200">No se pudieron cargar las categorías.</p>}
          {isLoading ? <p className="p-12 text-center text-slate-500">Cargando…</p> : data.length ? (
            <div className="divide-y divide-white/5">
              {data.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 sm:px-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: `${item.color}20`, color: item.color }}><Tags size={20} /></span>
                  <p className="min-w-0 flex-1 truncate font-medium">{item.name}</p>
                  <button onClick={() => startEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Editar categoría"><Pencil size={17} /></button>
                  <button onClick={() => window.confirm("¿Eliminar esta categoría?") && remove.mutate(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300" aria-label="Eliminar categoría"><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          ) : <p className="p-12 text-center text-slate-500">Creá tu primera categoría.</p>}
        </div>
      </section>
    </>
  );
}
