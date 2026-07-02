import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  fetchSensorHistory,
  fetchSensorAlerts,
  fetchAllSensors,
  patchSensorThresholds,
} from './externalApi';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('externalApi service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchSensorHistory requests the sensor endpoint with auth header and params', async () => {
    axios.get.mockResolvedValue({ data: { values: [1, 2, 3] } });

    const result = await fetchSensorHistory('https://api.example.com/', 'tok', 'dht22-t1', { limit: 10 });

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/lot/dht22-t1',
      { headers: { Authorization: 'Bearer tok' }, params: { limit: 10 } }
    );
    expect(result).toEqual({ values: [1, 2, 3] });
  });

  it('fetchSensorHistory strips trailing slashes from the base URL', async () => {
    axios.get.mockResolvedValue({ data: {} });

    await fetchSensorHistory('https://api.example.com///', 'tok', 'dht22-t1');

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/lot/dht22-t1',
      expect.anything()
    );
  });

  it('fetchSensorAlerts returns the array of alerts', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });

    const result = await fetchSensorAlerts('https://api.example.com', 'tok', 'dht22-t1');

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/alert/dht22-t1',
      { headers: { Authorization: 'Bearer tok' } }
    );
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('fetchSensorAlerts returns an empty array when the API responds with a non-array', async () => {
    axios.get.mockResolvedValue({ data: { unexpected: true } });

    const result = await fetchSensorAlerts('https://api.example.com', 'tok', 'dht22-t1');

    expect(result).toEqual([]);
  });

  it('fetchAllSensors returns the array of sensors', async () => {
    axios.get.mockResolvedValue({ data: [{ nom: 'dht22-t1' }] });

    const result = await fetchAllSensors('https://api.example.com', 'tok');

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/lot',
      { headers: { Authorization: 'Bearer tok' } }
    );
    expect(result).toEqual([{ nom: 'dht22-t1' }]);
  });

  it('fetchAllSensors returns an empty array when the API responds with a non-array', async () => {
    axios.get.mockResolvedValue({ data: null });

    const result = await fetchAllSensors('https://api.example.com', 'tok');

    expect(result).toEqual([]);
  });

  it('patchSensorThresholds sends only the provided min/max as query params', async () => {
    axios.patch.mockResolvedValue({ data: { status: 'ok' } });

    await patchSensorThresholds('https://api.example.com', 'tok', 'dht22-t1', { min: 10, max: '' });

    expect(axios.patch).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/dht22-t1',
      null,
      { headers: { Authorization: 'Bearer tok' }, params: { min: 10 } }
    );
  });

  it('patchSensorThresholds omits both params when min/max are null or undefined', async () => {
    axios.patch.mockResolvedValue({ data: {} });

    await patchSensorThresholds('https://api.example.com', 'tok', 'dht22-t1', { min: null, max: undefined });

    expect(axios.patch).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/dht22-t1',
      null,
      { headers: { Authorization: 'Bearer tok' }, params: {} }
    );
  });
});
