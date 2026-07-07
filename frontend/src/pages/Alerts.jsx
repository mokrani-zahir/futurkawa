import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAlertContext } from '../context/AlertContext';
import AlertItem from '../components/alerts/AlertItem';
import api from '../services/api';
import { resolveSensorAlert } from '../services/externalApi';

export default function Alerts() {
  const [filter, setFilter]       = useState('unresolved'); // 'all' | 'unresolved' | 'resolved'
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage]           = useState(1);

  const params = {
    ...(filter === 'unresolved' && { unresolved_only: true }),
    ...(filter === 'resolved' && { resolved_only: true }),
    ...(typeFilter && { type: typeFilter }),
    page,
  };

  const { data, loading, reload } = useApi('/alerts', params);
  const { markResolved, refresh: refreshGlobal } = useAlertContext();
  const alerts = data?.data ?? [];
  const meta   = data?.meta;

  const changeFilter = (value) => { setFilter(value); setPage(1); };
  const changeType   = (value) => { setTypeFilter(value); setPage(1); };

  const handleResolve = async (alert) => {
    await api.patch(`/alerts/${alert.id}/resolve`);

    // Also mark the alert as verified on the remote zone API, so it stays
    // in sync. Best-effort: local resolution already succeeded above.
    if (alert.type === 'webhook' && alert.zone?.api_url && alert.sensor_name) {
      try {
        const { data: tokenData } = await api.get(`/zones/${alert.zone.id}/token`);
        await resolveSensorAlert(alert.zone.api_url, tokenData.token, alert.sensor_name);
      } catch {
        // Ignore — the remote API may be unreachable or already up to date.
      }
    }

    markResolved(alert.id);
    reload();
    refreshGlobal();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Alertes</h2>
        <p className="text-sm text-slate-500 mt-0.5">Alertes reçues par webhook et alertes d'expiration de stockage</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {[
            { value: 'unresolved', label: 'Actives' },
            { value: 'resolved',   label: 'Résolues' },
            { value: 'all',        label: 'Toutes' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => changeFilter(value)}
              className={`px-3 py-1.5 ${filter === value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => changeType(e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">Tous les types</option>
          <option value="webhook">Webhook</option>
          <option value="storage_expiry">Expiration stockage</option>
        </select>

        <button onClick={reload} className="btn-secondary text-sm ml-auto">
          ↻ Rafraîchir
        </button>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-3xl">✓</span>
          <p className="text-slate-400 mt-2 text-sm">Aucune alerte dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {meta.from}–{meta.to} sur {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={meta.current_page <= 1}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              ← Précédent
            </button>
            <span className="text-slate-600">
              Page {meta.current_page} / {meta.last_page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={meta.current_page >= meta.last_page}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
