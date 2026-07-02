import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useZoneToken } from '../hooks/useZoneToken';
import { useWebSocket } from '../context/WebSocketContext';
import { useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import SensorLiveValue from '../components/sensors/SensorLiveValue';
import SensorChart from '../components/sensors/SensorChart';
import SensorAlerts from '../components/sensors/SensorAlerts';
import SensorAlertSettings from '../components/sensors/SensorAlertSettings';

export default function BatchDetail() {
  const { zoneId, batchId } = useParams();
  const { data: batchData, loading } = useApi(`/batches/${batchId}`);
  const { data: zoneData }           = useApi(`/zones/${zoneId}`);
  const { tokenData }                = useZoneToken(zoneId);
  const { connect, statuses }        = useWebSocket();
  const [openAlerts,    setOpenAlerts]    = useState({});
  const [openSettings,  setOpenSettings]  = useState({});

  const batch    = batchData?.data ?? batchData;
  const zone     = zoneData?.data ?? zoneData;
  const sensors  = batch?.sensors ?? [];
  const wsStatus = statuses[zoneId] ?? 'disconnected';

  useEffect(() => {
    if (tokenData?.ws_url && tokenData?.token) {
      connect(zoneId, tokenData.ws_url, tokenData.token);
    }
  }, [tokenData, zoneId, connect]);

  const toggleAlerts   = (s) => setOpenAlerts((p)   => ({ ...p, [s]: !p[s] }));
  const toggleSettings = (s) => setOpenSettings((p) => ({ ...p, [s]: !p[s] }));

  if (loading) {
    return <div className="text-slate-400 animate-pulse">Chargement du lot…</div>;
  }

  if (!batch) {
    return <div className="text-red-500">Lot introuvable.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link to="/zones" className="hover:text-blue-600">Zones</Link>
        <span className="mx-2">/</span>
        <Link to={`/zones/${zoneId}`} className="hover:text-blue-600">
          {zone?.name ?? '…'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">{batch.name}</span>
      </nav>

      {/* Batch info */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{batch.name}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
              <span>Début stockage : <strong>{batch.storage_start_date}</strong></span>
              <span>Durée : <strong>{batch.storage_duration_days} j</strong></span>
              <span>
                Expire :{' '}
                <strong className={batch.is_expired ? 'text-red-500' : 'text-green-600'}>
                  {batch.expires_at}
                </strong>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={batch.is_expired ? 'expired' : 'active'} />
            <StatusBadge status={wsStatus} />
          </div>
        </div>
      </div>

      {/* Sensors */}
      {sensors.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Aucun capteur associé à ce lot.
        </div>
      ) : (
        <div className="space-y-8">
          {sensors.map((sensorName) => (
            <div key={sensorName} className="card p-6 space-y-4">
              {/* Sensor header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 font-mono text-base">
                  {sensorName}
                </h3>
                {tokenData && (
                  <SensorLiveValue zoneId={zoneId} sensorName={sensorName} />
                )}
              </div>

              {/* Historical chart with interval picker */}
              {tokenData ? (
                <SensorChart
                  zoneId={zoneId}
                  sensorName={sensorName}
                  zoneApiUrl={zone?.api_url}
                  token={tokenData.token}
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                  Obtention du token JWT…
                </div>
              )}

              {tokenData && (
                <div className="space-y-0 border-t border-slate-100 divide-y divide-slate-100">

                  {/* Alert thresholds settings */}
                  <div className="pt-4 pb-4">
                    <button
                      onClick={() => toggleSettings(sensorName)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span className={`transition-transform duration-150 ${openSettings[sensorName] ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      Seuils d'alerte
                    </button>
                    {openSettings[sensorName] && (
                      <div className="mt-3">
                        <SensorAlertSettings
                          zoneApiUrl={zone?.api_url}
                          token={tokenData.token}
                          sensorName={sensorName}
                        />
                      </div>
                    )}
                  </div>

                  {/* External API alert history */}
                  <div className="pt-4">
                    <button
                      onClick={() => toggleAlerts(sensorName)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span className={`transition-transform duration-150 ${openAlerts[sensorName] ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      Historique des alertes (API externe)
                    </button>
                    {openAlerts[sensorName] && (
                      <div className="mt-3">
                        <SensorAlerts
                          zoneApiUrl={zone?.api_url}
                          token={tokenData.token}
                          sensorName={sensorName}
                        />
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
