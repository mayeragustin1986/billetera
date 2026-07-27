import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/AppLayout";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import TransactionsPage from "../pages/TransactionsPage";
import CategoriesPage from "../pages/CategoriesPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return session ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/movimientos" element={<TransactionsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
