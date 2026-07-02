import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../context/WebSocketContext';
import StatsGrid from '../components/dashboard/StatsGrid';
import ConnectionsStatus from '../components/dashboard/ConnectionsStatus';
import AlertItem from '../components/alerts/AlertItem';
import { useAlertContext } from '../context/AlertContext';

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useApi('/dashboard/stats');
  const { data: zonesData } = useApi('/zones');
  const { statuses } = useWebSocket();
  const { activeAlerts } = useAlertContext();

  const zones = zonesData?.data ?? [];
  const recentAlerts = activeAlerts.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Vue d'ensemble</h2>
        <p className="text-sm text-slate-500 mt-0.5">Supervision en temps réel de toutes les zones</p>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <StatsGrid stats={stats} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WebSocket connections */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Connexions WebSocket</h3>
          {zones.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune zone configurée.</p>
          ) : (
            <ConnectionsStatus zones={zones} statuses={statuses} />
          )}
        </div>

        {/* Recent active alerts */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            Alertes actives
            {activeAlerts.length > 0 && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                {activeAlerts.length}
              </span>
            )}
          </h3>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune alerte active. ✓</p>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
