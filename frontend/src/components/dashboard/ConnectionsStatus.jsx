import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';

export default function ConnectionsStatus({ zones, statuses }) {
  return (
    <div className="space-y-2">
      {zones.map((zone) => {
        const status = statuses[zone.id] ?? 'disconnected';
        return (
          <div
            key={zone.id}
            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <div>
              <Link
                to={`/zones/${zone.id}`}
                className="text-sm font-medium text-slate-800 hover:text-blue-600"
              >
                {zone.name}
              </Link>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
                {zone.api_url}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        );
      })}
    </div>
  );
}
