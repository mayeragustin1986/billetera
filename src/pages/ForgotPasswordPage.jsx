import { ArrowLeft, Mail, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    const { error: resetError } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (resetError) return setError(resetError.message);
    setSent(true);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950"><Wallet /></span>
        <h1 className="mt-7 text-3xl font-bold">Recuperá tu cuenta</h1>
        <p className="mt-2 text-slate-500">Te enviaremos un enlace seguro para crear una nueva contraseña.</p>
        {sent ? (
          <div className="mt-7 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Si existe una cuenta asociada, vas a recibir el enlace en tu email.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="relative block">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input className="field pl-11" type="email" required maxLength="254" autoComplete="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Enviando…" : "Enviar enlace"}</button>
          </form>
        )}
        <Link to="/auth" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={17} /> Volver al login</Link>
      </section>
    </main>
  );
}
