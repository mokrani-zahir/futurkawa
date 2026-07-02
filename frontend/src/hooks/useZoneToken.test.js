import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import api from '../services/api';
import { useZoneToken } from './useZoneToken';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

describe('useZoneToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the token for the given zone', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    api.get.mockResolvedValue({ data: { token: 'jwt', expires_at: expiresAt, ws_url: 'wss://x/ws/' } });

    const { result } = renderHook(() => useZoneToken('zone-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.get).toHaveBeenCalledWith('/zones/zone-1/token');
    expect(result.current.tokenData.token).toBe('jwt');
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when zoneId is falsy', () => {
    renderHook(() => useZoneToken(null));

    expect(api.get).not.toHaveBeenCalled();
  });

  it('surfaces an error message when the request fails', async () => {
    api.get.mockRejectedValue({ response: { data: { message: 'Zone introuvable.' } } });

    const { result } = renderHook(() => useZoneToken('zone-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Zone introuvable.');
    expect(result.current.tokenData).toBeNull();
  });

  it('schedules a proactive refresh 5 minutes before expiry', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // expires in 10 min
    api.get
      .mockResolvedValueOnce({ data: { token: 'jwt-1', expires_at: expiresAt, ws_url: 'wss://x/ws/' } })
      .mockResolvedValueOnce({ data: { token: 'jwt-2', expires_at: expiresAt, ws_url: 'wss://x/ws/' } });

    const { result } = renderHook(() => useZoneToken('zone-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledTimes(1);

    // Refresh is scheduled for (expiry - 5min) = 5 minutes from now
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 100);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(result.current.tokenData.token).toBe('jwt-2');
  });
});
