import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setError(""); setMessage(""); }, [mode]);
  if (session) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (mode === "register" && form.name.trim().length < 2) return setError("Ingresá tu nombre completo.");
    if (mode === "register" && form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setLoading(true); setError(""); setMessage("");
    const { data, error: authError } = mode === "login"
      ? await signIn(form.email, form.password)
      : await signUp(form.email, form.password, form.name);
    setLoading(false);
    if (authError) return setError(authError.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : authError.message);
    if (mode === "register" && !data.session) setMessage("Revisá tu email para confirmar la cuenta.");
  };

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.12),transparent_35%)]" />
        <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Wallet /></span><span className="text-xl font-bold">Billetera</span></div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[.25em] text-emerald-300">Tu dinero, más claro</p>
          <h1 className="text-5xl font-bold leading-tight">Tomá el control de tus finanzas.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">Registrá ingresos y gastos, entendé tus hábitos y decidí con información real.</p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={18} className="text-emerald-400" /> Tus datos están protegidos con Supabase.</div>
      </section>
      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Wallet size={20} /></span><span className="text-xl font-bold">Billetera</span></div>
          <p className="text-sm font-medium text-emerald-300">{mode === "login" ? "Bienvenido de nuevo" : "Empezá hoy"}</p>
          <h2 className="mt-2 text-3xl font-bold">{mode === "login" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}</h2>
          <p className="mt-2 text-slate-500">{mode === "login" ? "Accedé a tu panorama financiero." : "Solo necesitás unos pocos datos."}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && <input className="field" required minLength="2" placeholder="Nombre completo" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
            <input className="field" type="email" required maxLength="254" placeholder="Email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.trim() })} />
            <div className="relative">
              <input className="field pr-12" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : 6} maxLength="72" placeholder="Contraseña" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
            {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"} <ArrowRight size={18} /></button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-emerald-300 hover:text-emerald-200">{mode === "login" ? "Registrate" : "Ingresá"}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
