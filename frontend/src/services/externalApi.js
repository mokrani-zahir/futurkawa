import axios from 'axios';

/**
 * Fetch measurement history for a sensor from the external API.
 * Params: limit, form (from datetime), to (to datetime)
 * Note: the swagger uses "form" (not "from") as the start date param.
 */
export async function fetchSensorHistory(apiUrl, token, sensorName, params = {}) {
  const base = apiUrl.replace(/\/+$/, '');
  const res = await axios.get(`${base}/api/v1/lot/${sensorName}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

/**
 * Fetch alert history for a sensor from the external API.
 * GET /api/v1/alert/{lot}
 * Response items: { id, nom, valeur, date, is_checked }
 */
export async function fetchSensorAlerts(apiUrl, token, sensorName) {
  const base = apiUrl.replace(/\/+$/, '');
  const res = await axios.get(`${base}/api/v1/alert/${sensorName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch the list of all sensors with their current alert thresholds.
 * GET /api/v1/lot  →  [{ nom, type, max, min, description }]
 */
export async function fetchAllSensors(apiUrl, token) {
  const base = apiUrl.replace(/\/+$/, '');
  const res = await axios.get(`${base}/api/v1/lot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Mark a sensor's alert as verified/resolved on the remote API.
 * PATCH /api/v1/alert/{lot}
 * Response: { status, nom }
 */
export async function resolveSensorAlert(apiUrl, token, sensorName) {
  const base = apiUrl.replace(/\/+$/, '');
  const res = await axios.patch(`${base}/api/v1/alert/${sensorName}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Update the alert thresholds (min / max) for a sensor.
 * PATCH /api/v1/{lot}?min=&max=
 * Response: { status, capteur, max, min }
 */
export async function patchSensorThresholds(apiUrl, token, sensorName, { min, max }) {
  const base = apiUrl.replace(/\/+$/, '');
  const params = {};
  if (min !== '' && min !== null && min !== undefined) params.min = min;
  if (max !== '' && max !== null && max !== undefined) params.max = max;
  const res = await axios.patch(`${base}/api/v1/${sensorName}`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}
