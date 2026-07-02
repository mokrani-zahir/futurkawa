const CARDS = [
  { key: 'zones_count',     label: 'Zones',            icon: '🔷', color: 'text-blue-600',   bg: 'bg-blue-50' },
  { key: 'batches_count',   label: 'Lots',             icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'active_alerts',   label: 'Alertes actives',  icon: '🔴', color: 'text-red-600',    bg: 'bg-red-50' },
  { key: 'resolved_alerts', label: 'Alertes résolues', icon: '✅', color: 'text-green-600',  bg: 'bg-green-50' },
  { key: 'expired_batches', label: 'Lots expirés',     icon: '⏰', color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, icon, color, bg }) => (
        <div key={key} className="card p-5">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
            <span className="text-xl">{icon}</span>
          </div>
          <p className={`text-2xl font-bold ${color}`}>{stats[key] ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
