import { createContext, useContext, useRef, useState, useCallback } from 'react';

const WebSocketContext = createContext(null);

const toWsUrl = (url) => url.replace(/^https/, 'wss').replace(/^http/, 'ws');
const MAX_POINTS = 60;

// Normalize incoming frames to the documented {zone, lot, value, timestamp(seconds)}
// shape. Some remote APIs (e.g. the Node-RED test double) emit {topic, payload}
// instead of {lot, value}, and a millisecond epoch instead of seconds.
function normalizeMeasurement(raw) {
  const lot   = raw.lot   ?? raw.topic;
  const value = raw.value ?? raw.payload;
  let timestamp = raw.timestamp ?? Math.floor(Date.now() / 1000);
  if (timestamp > 1e12) timestamp = Math.floor(timestamp / 1000);
  return { ...raw, lot, value, timestamp };
}

export function WebSocketProvider({ children }) {
  const connections = useRef({});
  // Listener sets live independently of the socket so components can
  // subscribe() before connect() has created the WebSocket for a zone.
  const listeners = useRef({});
  const [statuses, setStatuses] = useState({});
  // Live measurements stored per zone+sensor: { [zoneId]: { [sensorName]: [{time,value}] } }
  const [measurements, setMeasurements] = useState({});

  const getListeners = (zoneId) => {
    if (!listeners.current[zoneId]) listeners.current[zoneId] = new Set();
    return listeners.current[zoneId];
  };

  const connect = useCallback((zoneId, rawWsUrl, token) => {
    const existing = connections.current[zoneId];
    if (existing?.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = toWsUrl(rawWsUrl);
    setStatuses((prev) => ({ ...prev, [zoneId]: 'connecting' }));

    const ws = new WebSocket(wsUrl);
    connections.current[zoneId] = { ws };

    ws.onopen = () => {
      setStatuses((prev) => ({ ...prev, [zoneId]: 'connected' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = normalizeMeasurement(JSON.parse(event.data));
        getListeners(zoneId).forEach((cb) => cb(data));

        // Store measurement point so any chart can read it from context
        if (data.lot && data.value !== undefined) {
          const time = new Date(
            (data.timestamp ?? Date.now() / 1000) * 1000
          ).toLocaleTimeString();
          setMeasurements((prev) => {
            const zone   = prev[zoneId]       ?? {};
            const sensor = zone[data.lot]     ?? [];
            const next   = [...sensor, { time, value: data.value }];
            if (next.length > MAX_POINTS) next.shift();
            return { ...prev, [zoneId]: { ...zone, [data.lot]: next } };
          });
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      setStatuses((prev) => ({ ...prev, [zoneId]: 'disconnected' }));
    };

    ws.onclose = () => {
      setStatuses((prev) => ({ ...prev, [zoneId]: 'disconnected' }));
      delete connections.current[zoneId];
    };
  }, []);

  /**
   * Subscribe to messages from a specific zone's WebSocket.
   * Returns an unsubscribe function.
   */
  const subscribe = useCallback((zoneId, callback) => {
    getListeners(zoneId).add(callback);
    return () => {
      listeners.current[zoneId]?.delete(callback);
    };
  }, []);

  const disconnect = useCallback((zoneId) => {
    connections.current[zoneId]?.ws.close();
    delete connections.current[zoneId];
    setStatuses((prev) => ({ ...prev, [zoneId]: 'disconnected' }));
  }, []);

  return (
    <WebSocketContext.Provider value={{ connect, subscribe, disconnect, statuses, measurements }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
