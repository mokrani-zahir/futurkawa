import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

/**
 * Fetches a valid JWT + WebSocket URL for a given zone from the Laravel backend.
 * Auto-refreshes the token 5 minutes before it expires.
 *
 * Returns { tokenData: { token, expires_at, ws_url }, loading, error }
 */
export function useZoneToken(zoneId) {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchToken = useCallback(async () => {
    if (!zoneId) return;
    try {
      const { data } = await api.get(`/zones/${zoneId}/token`);
      setTokenData(data);
      setError(null);

      // Schedule proactive refresh 5 min before expiry
      const expiresAt = new Date(data.expires_at).getTime();
      const refreshIn = expiresAt - Date.now() - 5 * 60 * 1000;
      if (refreshIn > 0) {
        timerRef.current = setTimeout(fetchToken, refreshIn);
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Impossible d\'obtenir le token.');
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    setLoading(true);
    fetchToken();
    return () => clearTimeout(timerRef.current);
  }, [fetchToken]);

  return { tokenData, loading, error, refresh: fetchToken };
}
