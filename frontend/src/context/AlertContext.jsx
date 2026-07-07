import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AlertContext = createContext(null);

const POLL_INTERVAL_MS = 5_000;

export function AlertProvider({ children }) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchActive = useCallback(async () => {
    try {
      const { data } = await api.get('/alerts', {
        params: { unresolved_only: true },
      });
      setActiveAlerts(data.data ?? []);
      setUnreadCount(data.data?.length ?? 0);
    } catch {
      // Fail silently — user might not be logged in yet
    }
  }, []);

  // Poll for new alerts every 30 s
  useEffect(() => {
    fetchActive();
    const id = setInterval(fetchActive, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchActive]);

  const markResolved = useCallback((alertId) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <AlertContext.Provider value={{ activeAlerts, unreadCount, refresh: fetchActive, markResolved }}>
      {children}
    </AlertContext.Provider>
  );
}

export const useAlertContext = () => useContext(AlertContext);
