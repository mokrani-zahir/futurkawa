import { useState, useEffect } from 'react';
import { fetchAllSensors, patchSensorThresholds } from '../../services/externalApi';

export default function SensorAlertSettings({ zoneApiUrl, token, sensorName }) {
  const [min, setMin]         = useState('');
  const [max, setMax]         = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  // Load current thresholds from GET /api/v1/lot
  useEffect(() => {
    if (!zoneApiUrl || !token) return;
    setLoading(true);
    fetchAllSensors(zoneApiUrl, token)
      .then((sensors) => {
        const found = sensors.find(
          (s) => s.nom === sensorName || s.name === sensorName
        );
        if (found) {
          setMin(found.min ?? '');
          setMax(found.max ?? '');
        }
      })
      .catch(() => setError('Impossible de charger les seuils actuels.'))
      .finally(() => setLoading(false));
  }, [zoneApiUrl, token, sensorName]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await patchSensorThresholds(zoneApiUrl, token, sensorName, { min, max });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Échec de la mise à jour des seuils.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-xs text-slate-400 animate-pulse py-2">
        Chargement des seuils…
      </p>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Min */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Seuil minimum
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="ex : 5"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">°</span>
          </div>
        </div>

        {/* Max */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Seuil maximum
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="ex : 30"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">°</span>
          </div>
        </div>
      </div>

      {/* Visual indicator */}
      {min !== '' && max !== '' && Number(min) < Number(max) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-blue-500 font-medium">{min}</span>
          <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-blue-200 via-green-200 to-red-200" />
          <span className="text-red-500 font-medium">{max}</span>
        </div>
      )}

      {error   && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="text-xs text-green-600 font-medium">
          Seuils mis à jour avec succès.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg font-medium transition-colors"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer les seuils'}
      </button>
    </form>
  );
}
