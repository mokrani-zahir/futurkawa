import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../services/api';
import { AlertProvider, useAlertContext } from './AlertContext';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

function Consumer() {
  const { activeAlerts, unreadCount, markResolved } = useAlertContext();
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <span data-testid="alerts">{activeAlerts.map((a) => a.id).join(',')}</span>
      <button onClick={() => markResolved('a1')}>resolve-a1</button>
    </div>
  );
}

describe('AlertContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches active alerts on mount', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 'a1' }, { id: 'a2' }] } });

    render(<AlertProvider><Consumer /></AlertProvider>);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
    expect(screen.getByTestId('alerts')).toHaveTextContent('a1,a2');
    expect(api.get).toHaveBeenCalledWith('/alerts', { params: { unresolved_only: true } });
  });

  it('fails silently when the request errors (e.g. not logged in yet)', async () => {
    api.get.mockRejectedValue(new Error('unauthenticated'));

    render(<AlertProvider><Consumer /></AlertProvider>);

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('markResolved removes the alert locally and decrements the count', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 'a1' }, { id: 'a2' }] } });

    render(<AlertProvider><Consumer /></AlertProvider>);
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));

    await userEvent.click(screen.getByText('resolve-a1'));

    expect(screen.getByTestId('alerts')).toHaveTextContent('a2');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('polls for new alerts every 30 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.get.mockResolvedValue({ data: { data: [] } });

    render(<AlertProvider><Consumer /></AlertProvider>);
    await act(async () => {}); // flush initial fetch
    expect(api.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
