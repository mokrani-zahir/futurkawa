import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import api from '../services/api';
import { useApi } from './useApi';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in a loading state and resolves with the fetched data', async () => {
    api.get.mockResolvedValue({ data: { foo: 'bar' } });

    const { result } = renderHook(() => useApi('/zones'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/zones', { params: {} });
  });

  it('exposes a network error message when the request fails without a response body', async () => {
    api.get.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useApi('/zones'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Erreur réseau.');
    expect(result.current.data).toBeNull();
  });

  it('surfaces the API-provided error message when present', async () => {
    api.get.mockRejectedValue({ response: { data: { message: 'Zone introuvable.' } } });

    const { result } = renderHook(() => useApi('/zones/123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Zone introuvable.');
  });

  it('does not fetch when url is falsy', () => {
    renderHook(() => useApi(null));

    expect(api.get).not.toHaveBeenCalled();
  });

  it('reload re-fetches the data', async () => {
    api.get.mockResolvedValue({ data: { count: 1 } });

    const { result } = renderHook(() => useApi('/zones'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    api.get.mockResolvedValue({ data: { count: 2 } });
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.data).toEqual({ count: 2 });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
