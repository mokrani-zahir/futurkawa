import { useState, useEffect } from 'react';
import { fetchSensorAlerts } from '../../services/externalApi';

export default function SensorAlerts({ zoneApiUrl, token, sensorName }) {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!zoneApiUrl || !token) return;
    setLoading(true);
    fetchSensorAlerts(zoneApiUrl, token, sensorName)
      .then(setAlerts)
      .catch(() => setError('Impossible de charger les alertes.'))
      .finally(() => setLoading(false));
  }, [zoneApiUrl, token, sensorName]);

  if (loading) {
    return (
      <div className="text-xs text-slate-400 animate-pulse py-2">
        Chargement des alertes…
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-500 py-2">{error}</p>;
  }

  if (alerts.length === 0) {
    return (
      <p className="text-xs text-slate-400 py-2 italic">
        Aucune alerte enregistrée pour ce capteur.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Valeur</th>
            <th className="py-2 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, i) => (
            <tr key={alert.id ?? i} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="py-2 pr-4 text-slate-600">
                {new Date(alert.date).toLocaleString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="py-2 pr-4 font-mono font-medium text-slate-800">
                {alert.valeur ?? alert.value ?? '—'}
              </td>
              <td className="py-2">
                {alert.is_checked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                    Non vérifié
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
