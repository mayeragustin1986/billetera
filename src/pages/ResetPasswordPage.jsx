import { Eye, EyeOff, KeyRound, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ResetPasswordPage() {
  const { session, loading: authLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");
    setLoading(true); setError("");
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) return setError(updateError.message);
    setUpdated(true);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Wallet /></span>
        <h1 className="mt-7 text-3xl font-bold">Nueva contraseña</h1>
        <p className="mt-2 text-slate-500">Elegí una contraseña segura para tu cuenta.</p>
        {authLoading ? <p className="mt-7 text-slate-500">Validando enlace…</p> : updated ? (
          <div className="mt-7">
            <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">La contraseña fue actualizada correctamente.</p>
            <Link to="/" className="btn-primary mt-4 w-full">Ir a Billetera</Link>
          </div>
        ) : !session ? (
          <div className="mt-7">
            <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">El enlace venció o no es válido.</p>
            <Link to="/recuperar" className="btn-primary mt-4 w-full">Solicitar otro enlace</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            {[{ value: password, setter: setPassword, label: "Nueva contraseña" }, { value: confirmation, setter: setConfirmation, label: "Repetir contraseña" }].map((field) => (
              <label key={field.label} className="relative block">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
                <input className="field px-11" type={show ? "text" : "password"} required minLength="8" maxLength="72" autoComplete="new-password" placeholder={field.label} value={field.value} onChange={(event) => field.setter(event.target.value)} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Mostrar contraseña">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </label>
            ))}
            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Guardando…" : "Actualizar contraseña"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
