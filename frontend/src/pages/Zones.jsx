import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import ZoneCard from '../components/zones/ZoneCard';
import ZoneForm from '../components/zones/ZoneForm';
import Modal from '../components/ui/Modal';

export default function Zones() {
  const { data, loading, reload } = useApi('/zones');
  const [showForm, setShowForm] = useState(false);

  const zones = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Zones</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gérez vos instances d'API distantes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nouvelle zone
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">🔷</span>
          <p className="text-slate-500 mt-3">Aucune zone configurée.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            Créer la première zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} onDeleted={reload} />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Nouvelle zone" onClose={() => setShowForm(false)}>
          <ZoneForm
            onSaved={() => { setShowForm(false); reload(); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
