import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm animate-pulse">Chargement…</div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
