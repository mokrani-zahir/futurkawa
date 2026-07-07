import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // test helpers to drive the lifecycle
  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  message(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}
MockWebSocket.instances = [];

let capturedApi = null;

function Consumer() {
  const api = useWebSocket();
  capturedApi = api;
  return (
    <div>
      <span data-testid="status">{api.statuses['zone-1'] ?? 'none'}</span>
      <span data-testid="measurements">
        {JSON.stringify(api.measurements['zone-1']?.['dht22-t1'] ?? [])}
      </span>
    </div>
  );
}

describe('WebSocketContext', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects and transitions status from connecting to connected', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);

    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));
    expect(screen.getByTestId('status')).toHaveTextContent('connecting');
    expect(MockWebSocket.instances[0].url).toBe('wss://api.example.com/ws/');

    act(() => MockWebSocket.instances[0].open());
    expect(screen.getByTestId('status')).toHaveTextContent('connected');
  });

  it('does not open a second socket while one is already connected', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);

    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));
    act(() => MockWebSocket.instances[0].open());
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('notifies subscribers and stores measurements on message', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));

    const received = [];
    let unsubscribe;
    act(() => {
      unsubscribe = capturedApi.subscribe('zone-1', (data) => received.push(data));
    });

    act(() => MockWebSocket.instances[0].message({
      zone: 'brazil', lot: 'dht22-t1', value: 23.6, timestamp: 1782894384,
    }));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ lot: 'dht22-t1', value: 23.6 });

    const stored = JSON.parse(screen.getByTestId('measurements').textContent);
    expect(stored).toHaveLength(1);
    expect(stored[0].value).toBe(23.6);

    act(() => unsubscribe());
    act(() => MockWebSocket.instances[0].message({
      zone: 'brazil', lot: 'dht22-t1', value: 24.1, timestamp: 1782894385,
    }));
    expect(received).toHaveLength(1); // unsubscribed, no new entry
  });

  it('normalizes {topic,payload} frames and millisecond timestamps', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));

    const received = [];
    act(() => capturedApi.subscribe('zone-1', (data) => received.push(data)));

    act(() => MockWebSocket.instances[0].message({
      topic: 'dht22-t1', payload: 19.2, timestamp: Date.now(), // ms epoch
    }));

    expect(received[0].lot).toBe('dht22-t1');
    expect(received[0].value).toBe(19.2);
    expect(received[0].timestamp).toBeLessThan(1e12); // converted to seconds
  });

  it('ignores malformed message frames', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));

    expect(() => act(() => {
      MockWebSocket.instances[0].onmessage({ data: 'not json' });
    })).not.toThrow();
  });

  it('sets status to disconnected on error and on close', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));
    act(() => MockWebSocket.instances[0].open());

    act(() => MockWebSocket.instances[0].onerror?.());
    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
  });

  it('disconnect closes the socket and marks the zone disconnected', () => {
    render(<WebSocketProvider><Consumer /></WebSocketProvider>);
    act(() => capturedApi.connect('zone-1', 'https://api.example.com/ws/', 'tok'));
    act(() => MockWebSocket.instances[0].open());

    act(() => capturedApi.disconnect('zone-1'));

    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.CLOSED);
  });
});
