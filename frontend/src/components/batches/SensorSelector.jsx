import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Fetches available sensors from the external API and lets the user
 * pick one or more to associate with a batch.
 */
export default function SensorSelector({ zoneApiUrl, token, selected, onChange }) {
  const [sensors, setSensors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!zoneApiUrl || !token) return;
    axios
      .get(`${zoneApiUrl}/api/v1/lot`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSensors(data);
      })
      .catch(() => setError('Impossible de récupérer les capteurs depuis l\'API distante.'))
      .finally(() => setLoading(false));
  }, [zoneApiUrl, token]);

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  if (!token) {
    return <p className="text-xs text-slate-400 italic">Token JWT non disponible…</p>;
  }

  if (loading) {
    return <p className="text-xs text-slate-400 animate-pulse">Chargement des capteurs…</p>;
  }

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  if (sensors.length === 0) {
    return <p className="text-xs text-slate-400">Aucun capteur trouvé sur l'API distante.</p>;
  }

  return (
    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
      {sensors.map((sensor) => {
        const name = sensor.nom ?? sensor.name ?? sensor;
        return (
          <label key={name} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(name)}
              onChange={() => toggle(name)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-mono text-slate-700 group-hover:text-blue-600">{name}</span>
            {sensor.type && (
              <span className="text-xs text-slate-400 ml-auto">{sensor.type}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
