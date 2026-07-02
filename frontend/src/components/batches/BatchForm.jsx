import { useState } from 'react';
import api from '../../services/api';
import SensorSelector from './SensorSelector';

export default function BatchForm({ zoneId, tokenData, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name:                  '',
    storage_start_date:    new Date().toISOString().slice(0, 10),
    storage_duration_days: 365,
  });
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/batches', {
        ...form,
        zone_id:               zoneId,
        storage_duration_days: Number(form.storage_duration_days),
        sensors,
      });
      onSaved?.();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(' ')
          : err?.response?.data?.message ?? 'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="label">Nom du lot</label>
        <input className="input" value={form.name} onChange={set('name')} required placeholder="Salle de production" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date de début</label>
          <input className="input" type="date" value={form.storage_start_date} onChange={set('storage_start_date')} required />
        </div>
        <div>
          <label className="label">Durée (jours)</label>
          <input className="input" type="number" min="1" value={form.storage_duration_days} onChange={set('storage_duration_days')} required />
        </div>
      </div>

      <div>
        <label className="label">
          Capteurs associés
          {sensors.length > 0 && (
            <span className="ml-2 text-blue-600 font-normal">{sensors.length} sélectionné{sensors.length > 1 ? 's' : ''}</span>
          )}
        </label>
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <SensorSelector
            zoneApiUrl={tokenData?.ws_url?.replace('/ws/', '')}
            token={tokenData?.token}
            selected={sensors}
            onChange={setSensors}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Création…' : 'Créer le lot'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
