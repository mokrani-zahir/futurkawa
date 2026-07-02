import { useState, useEffect } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

/**
 * Displays the most recent value received for a sensor via WebSocket.
 */
export default function SensorLiveValue({ zoneId, sensorName, compact = false }) {
  const { subscribe } = useWebSocket();
  const [latest, setLatest] = useState(null);
  const [flash, setFlash]   = useState(false);

  useEffect(() => {
    const unsub = subscribe(zoneId, (msg) => {
      if (msg.lot !== sensorName) return;
      setLatest(msg);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    });
    return unsub;
  }, [zoneId, sensorName, subscribe]);

  if (!latest) {
    return (
      <span className="text-xs text-slate-400 italic">En attente de données…</span>
    );
  }

  if (compact) {
    return (
      <span className={`font-semibold transition-colors ${flash ? 'text-blue-600' : 'text-slate-700'}`}>
        {latest.value}
      </span>
    );
  }

  return (
    <div className={`flex items-baseline gap-1 transition-colors ${flash ? 'text-blue-600' : 'text-slate-800'}`}>
      <span className="text-2xl font-bold">{latest.value}</span>
      <span className="text-xs text-slate-500">
        {new Date(latest.timestamp * 1000).toLocaleTimeString()}
      </span>
    </div>
  );
}
