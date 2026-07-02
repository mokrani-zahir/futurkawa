import { Link } from 'react-router-dom';
import { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import SensorLiveValue from '../sensors/SensorLiveValue';
import api from '../../services/api';

export default function BatchCard({ batch, zoneId, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer le lot "${batch.name}" ?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/batches/${batch.id}`);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

  const sensors = Array.isArray(batch.sensors) ? batch.sensors : [];

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-800 truncate">{batch.name}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={batch.is_expired ? 'expired' : 'active'} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-slate-300 hover:text-red-500 transition-colors text-sm"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1 mt-2">
        <div className="flex justify-between">
          <span>Début :</span>
          <span className="font-medium">{batch.storage_start_date}</span>
        </div>
        <div className="flex justify-between">
          <span>Durée :</span>
          <span className="font-medium">{batch.storage_duration_days} jours</span>
        </div>
        <div className="flex justify-between">
          <span>Expire :</span>
          <span className={`font-medium ${batch.is_expired ? 'text-red-500' : 'text-green-600'}`}>
            {batch.expires_at}
          </span>
        </div>
      </div>

      {sensors.length > 0 && (
        <div className="mt-3 space-y-1">
          {sensors.map((s) => (
            <div
              key={s}
              className="flex items-center justify-between gap-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
            >
              <span className="font-mono">{s}</span>
              <SensorLiveValue zoneId={zoneId} sensorName={s} compact />
            </div>
          ))}
        </div>
      )}

      <Link
        to={`/zones/${zoneId}/batches/${batch.id}`}
        className="btn-secondary w-full justify-center mt-4 text-sm"
      >
        Voir les capteurs →
      </Link>
    </div>
  );
}
