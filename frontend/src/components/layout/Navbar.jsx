import { useLocation } from 'react-router-dom';
import { useAlertContext } from '../../context/AlertContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/zones':     'Zones',
  '/alerts':    'Alertes',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { unreadCount, refresh } = useAlertContext();

  const title = TITLES[pathname] ?? 'FutureKawa';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        {unreadCount > 0 && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            {unreadCount} alerte{unreadCount > 1 ? 's' : ''} active{unreadCount > 1 ? 's' : ''}
          </span>
        )}
        <button
          onClick={refresh}
          title="Rafraîchir les alertes"
          className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          ↻
        </button>
      </div>
    </header>
  );
}
