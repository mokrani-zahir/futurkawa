import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useZoneToken } from '../hooks/useZoneToken';
import { useWebSocket } from '../context/WebSocketContext';
import StatusBadge from '../components/ui/StatusBadge';
import BatchCard from '../components/batches/BatchCard';
import BatchForm from '../components/batches/BatchForm';
import Modal from '../components/ui/Modal';

export default function ZoneDetail() {
  const { zoneId } = useParams();
  const { data: zoneData, loading: zoneLoading } = useApi(`/zones/${zoneId}`);
  const { data: batchData, loading: batchLoading, reload: reloadBatches } = useApi('/batches', { zone_id: zoneId });
  const { tokenData, loading: tokenLoading, error: tokenError } = useZoneToken(zoneId);
  const { connect, statuses } = useWebSocket();
  const [showBatchForm, setShowBatchForm] = useState(false);

  const zone    = zoneData?.data ?? zoneData;
  const batches = batchData?.data ?? [];
  const wsStatus = statuses[zoneId] ?? 'disconnected';

  // Connect to this zone's WebSocket as soon as we have a token
  useEffect(() => {
    if (tokenData?.ws_url && tokenData?.token) {
      connect(zoneId, tokenData.ws_url, tokenData.token);
    }
  }, [tokenData, zoneId, connect]);

  if (zoneLoading) {
    return <div className="text-slate-400 animate-pulse">Chargement de la zone…</div>;
  }

  if (!zone) {
    return <div className="text-red-500">Zone introuvable.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link to="/zones" className="hover:text-blue-600">Zones</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800 font-medium">{zone.name}</span>
      </nav>

      {/* Zone header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{zone.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5 font-mono">{zone.api_url}</p>
            <p className="text-xs text-slate-400 mt-1">Utilisateur : {zone.api_username}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={wsStatus} />
            {tokenLoading && <span className="text-xs text-slate-400 animate-pulse">Obtention du JWT…</span>}
            {tokenError && <span className="text-xs text-red-500">{tokenError}</span>}
          </div>
        </div>
      </div>

      {/* Batches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">
            Lots <span className="text-slate-400 font-normal">({batches.length})</span>
          </h3>
          <button onClick={() => setShowBatchForm(true)} className="btn-primary text-sm">
            + Nouveau lot
          </button>
        </div>

        {batchLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card p-5 h-28 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-slate-400 text-sm">Aucun lot pour cette zone.</p>
            <button onClick={() => setShowBatchForm(true)} className="btn-secondary mt-3 text-sm">
              Créer le premier lot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} zoneId={zoneId} onDeleted={reloadBatches} />
            ))}
          </div>
        )}
      </div>

      {showBatchForm && (
        <Modal title="Nouveau lot" onClose={() => setShowBatchForm(false)}>
          <BatchForm
            zoneId={zoneId}
            tokenData={tokenData}
            onSaved={() => { setShowBatchForm(false); reloadBatches(); }}
            onCancel={() => setShowBatchForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
