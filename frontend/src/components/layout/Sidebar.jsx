import { NavLink } from 'react-router-dom';
import { useAlertContext } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  icon: '⊞' },
  { to: '/zones',     label: 'Zones',      icon: '🔷' },
  { to: '/alerts',    label: 'Alertes',    icon: '🔔' },
];

export default function Sidebar() {
  const { unreadCount } = useAlertContext();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="text-white font-bold text-lg tracking-tight">⚡ FutureKawa</span>
        <p className="text-xs text-slate-500 mt-0.5">Supervision</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
            {label === 'Alertes' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 truncate">{user?.name}</p>
        <p className="text-xs text-slate-600 truncate mb-3">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          ↩ Déconnexion
        </button>
      </div>
    </aside>
  );
}
