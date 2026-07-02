import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Generic data-fetching hook.
 * Usage: const { data, loading, error, reload } = useApi('/zones');
 */
export function useApi(url, params = {}) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const key = url + JSON.stringify(params);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
