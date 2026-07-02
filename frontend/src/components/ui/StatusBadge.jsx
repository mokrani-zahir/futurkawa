const STYLES = {
  connected:    'bg-green-100 text-green-700',
  disconnected: 'bg-red-100 text-red-600',
  connecting:   'bg-yellow-100 text-yellow-700',
  expired:      'bg-red-100 text-red-600',
  active:       'bg-green-100 text-green-700',
  webhook:      'bg-blue-100 text-blue-700',
  storage_expiry: 'bg-orange-100 text-orange-700',
};

const LABELS = {
  connected:    'Connecté',
  disconnected: 'Déconnecté',
  connecting:   'Connexion…',
  expired:      'Expiré',
  active:       'Actif',
  webhook:      'Webhook',
  storage_expiry: 'Expiration stockage',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {status === 'connecting' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />}
      {LABELS[status] ?? status}
    </span>
  );
}
