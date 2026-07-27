import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(10,132,255,.22),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(48,209,88,.10),transparent_35%)]" />
        <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0a84ff] text-white"><Wallet /></span><span className="text-xl font-bold">Billetera</span></div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-lg font-semibold text-[#0a84ff]">Tu plata, más clara</p>
          <h1 className="text-6xl font-bold leading-tight tracking-[-.05em]">Sabé cuánto tenés.</h1>
          <p className="mt-6 max-w-lg text-xl leading-relaxed text-[#8e8e93]">Anotá lo que cobrás y lo que pagás. Nada más.</p>
        </div>
        <div className="relative flex items-center gap-2 text-base text-[#8e8e93]"><ShieldCheck size={20} className="text-[#30d158]" /> Tu información está protegida.</div>
      </section>
      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0a84ff] text-white"><Wallet size={22} /></span><span className="text-xl font-bold">Billetera</span></div>
          <p className="text-lg font-semibold text-[#0a84ff]">{mode === "login" ? "Qué bueno verte" : "Empezá hoy"}</p>
          <h2 className="mt-2 text-5xl font-bold tracking-[-.04em]">{mode === "login" ? "Entrar" : "Crear mi cuenta"}</h2>
          <p className="mt-4 text-lg text-[#8e8e93]">{mode === "login" ? "Tu plata te está esperando." : "Son solo tres datos."}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && <input className="field" required minLength="2" placeholder="Nombre completo" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
            <input className="field" type="email" required maxLength="254" placeholder="Email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.trim() })} />
            <div className="relative">
              <input className="field pr-12" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : 6} maxLength="72" placeholder="Contraseña" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
            {mode === "login" && <div className="text-right"><Link to="/recuperar" className="text-sm font-medium text-emerald-300 hover:text-emerald-200">Olvidé mi contraseña</Link></div>}
            {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Un momento…" : mode === "login" ? "Entrar" : "Crear mi cuenta"} <ArrowRight size={20} /></button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-[#0a84ff]">{mode === "login" ? "Crear mi cuenta" : "Entrar"}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
