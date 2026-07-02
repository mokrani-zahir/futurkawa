import { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';

const TYPE_ICON = {
  webhook:        '📡',
  storage_expiry: '⏰',
};

export default function AlertItem({ alert, compact = false, onResolve }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await onResolve?.(alert);
    } finally {
      setResolving(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
        <span>{TYPE_ICON[alert.type] ?? '⚠'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{alert.title}</p>
          <p className="text-xs text-slate-400">{alert.zone?.name} · {new Date(alert.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={alert.type} />
      </div>
    );
  }

  return (
    <div className={`card p-4 border-l-4 ${alert.is_resolved ? 'border-l-green-400 opacity-70' : 'border-l-red-400'}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[alert.type] ?? '⚠'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-slate-800">{alert.title}</p>
            <StatusBadge status={alert.type} />
          </div>
          <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            {alert.zone?.name && <span>Zone : {alert.zone.name}</span>}
            {alert.sensor_name && <span>Capteur : {alert.sensor_name}</span>}
            <span>{new Date(alert.created_at).toLocaleString()}</span>
          </div>
          {alert.is_resolved && alert.resolved_at && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Résolu le {new Date(alert.resolved_at).toLocaleString()}
              {alert.resolved_by?.name && ` par ${alert.resolved_by.name}`}
            </p>
          )}
        </div>
        {!alert.is_resolved && onResolve && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="btn-success text-xs flex-shrink-0"
          >
            {resolving ? '…' : '✓ Résoudre'}
          </button>
        )}
      </div>
    </div>
  );
}
