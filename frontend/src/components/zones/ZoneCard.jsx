import { Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

export default function ZoneCard({ zone, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer la zone "${zone.name}" ?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/zones/${zone.id}`);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
          🔷
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-slate-300 hover:text-red-500 transition-colors text-sm"
          title="Supprimer"
        >
          {deleting ? '…' : '✕'}
        </button>
      </div>

      <h3 className="font-semibold text-slate-800 truncate">{zone.name}</h3>
      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{zone.api_url}</p>

      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
        <span>{zone.batches_count ?? 0} lot{zone.batches_count !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{zone.alerts_count ?? 0} alerte{zone.alerts_count !== 1 ? 's' : ''}</span>
      </div>

      <Link
        to={`/zones/${zone.id}`}
        className="btn-secondary w-full justify-center mt-4 text-sm"
      >
        Voir la zone →
      </Link>
    </div>
  );
}
