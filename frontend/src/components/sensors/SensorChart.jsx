import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useWebSocket } from '../../context/WebSocketContext';
import { fetchSensorHistory } from '../../services/externalApi';

const MAX_LIVE = 60;

// datetime-local inputs (and the from/to API params) are local wall-clock
// time with no timezone — toISOString() would give UTC and skew the range
// by the browser's UTC offset, so format manually from local getters.
function toLocalStr(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function nowStr() {
  return toLocalStr(new Date());
}
function daysAgoStr(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalStr(d);
}
function hoursAgoStr(hours) {
  return toLocalStr(new Date(Date.now() - hours * 3_600_000));
}

const CHART_OPTIONS = {
  responsive: true,
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      ticks: { maxTicksLimit: 8, font: { size: 10 } },
      grid: { display: false },
    },
    y: {
      min: 0,
      max: 100,
      ticks: { font: { size: 10 } },
      grid: { color: '#f1f5f9' },
    },
  },
};

function buildDataset(labels, values) {
  return {
    labels,
    datasets: [{
      data: values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      borderWidth: 2,
    }],
  };
}

const PRESETS = [
  { label: '1h',  getRange: () => ({ from: hoursAgoStr(1),   to: nowStr() }) },
  { label: '24h', getRange: () => ({ from: hoursAgoStr(24),  to: nowStr() }) },
  { label: '7j',  getRange: () => ({ from: daysAgoStr(7),    to: nowStr() }) },
  { label: '30j', getRange: () => ({ from: daysAgoStr(30),   to: nowStr() }) },
];

export default function SensorChart({ zoneId, sensorName, zoneApiUrl, token }) {
  const { subscribe }          = useWebSocket();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [from, setFrom]           = useState(() => daysAgoStr(7));
  const [to, setTo]               = useState(nowStr);

  const handleFromChange = (e) => setFrom(e.target.value);
  const handleToChange   = (e) => setTo(e.target.value);

  // loadHistory receives explicit from/to to avoid stale-closure issues
  async function loadHistory(fromVal, toVal) {
    if (!zoneApiUrl || !token) return;
    setLoading(true);
    setError(null);
    try {
      const raw     = await fetchSensorHistory(zoneApiUrl, token, sensorName, {
        from:  fromVal + ':00',
        to:    toVal   + ':00',
        limit: 5000,
      });
      const records = Array.isArray(raw) ? raw : [];
      const labels  = records.map((r) =>
        new Date(r.date).toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit',
          hour: '2-digit', minute: '2-digit',
        })
      );
      const values = records.map((r) => r.value ?? r.valeur ?? 0);
      setChartData(buildDataset(labels, values));
    } catch {
      setError("Impossible de charger l'historique.");
      setChartData(buildDataset([], []));
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadHistory(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneApiUrl, token, sensorName]);

  // Append live WS points on top of history
  useEffect(() => {
    const unsub = subscribe(zoneId, (msg) => {
      if (msg.lot !== sensorName) return;
      const time = new Date(
        (msg.timestamp ?? Date.now() / 1000) * 1000
      ).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
      setChartData((prev) => {
        if (!prev) return prev;
        const labels = [...prev.labels, time];
        const values = [...prev.datasets[0].data, msg.value];
        if (labels.length > MAX_LIVE) { labels.shift(); values.shift(); }
        return buildDataset(labels, values);
      });
    });
    return unsub;
  }, [zoneId, sensorName, subscribe]);

  function applyPreset({ from: f, to: t }) {
    setFrom(f);
    setTo(t);
    loadHistory(f, t);
  }

  function handleApply() {
    loadHistory(from, to);
  }

  return (
    <div className="space-y-3">
      {/* Interval controls */}
      <div className="flex flex-wrap items-end gap-3 bg-slate-50 rounded-lg p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Début</label>
          <input
            type="datetime-local"
            value={from}
            onChange={handleFromChange}
            className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Fin</label>
          <input
            type="datetime-local"
            value={to}
            onChange={handleToChange}
            className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-1.5 rounded font-medium transition-colors"
        >
          {loading ? 'Chargement…' : 'Appliquer'}
        </button>

        {/* Quick presets — call loadHistory directly with computed values */}
        <div className="flex gap-1 ml-auto">
          {PRESETS.map(({ label, getRange }) => (
            <button
              key={label}
              onClick={() => applyPreset(getRange())}
              disabled={loading}
              className="text-xs bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 text-slate-600 px-2 py-1 rounded transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center py-2">{error}</p>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm animate-pulse">
          Chargement…
        </div>
      ) : !chartData || chartData.labels.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
          Aucune donnée pour cet intervalle.
        </div>
      ) : (
        <Line data={chartData} options={CHART_OPTIONS} />
      )}
    </div>
  );
}
