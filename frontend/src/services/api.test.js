import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const instance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

describe('api service', () => {
  let requestInterceptor;
  let responseSuccessInterceptor;
  let responseErrorInterceptor;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    // Re-import so axios.create() runs again and interceptors are freshly registered
    await import('./api');
    const instance = axios.create.mock.results.at(-1).value;
    requestInterceptor = instance.interceptors.request.use.mock.calls.at(-1)[0];
    const [onSuccess, onError] = instance.interceptors.response.use.mock.calls.at(-1);
    responseSuccessInterceptor = onSuccess;
    responseErrorInterceptor = onError;
  });

  afterEach(() => {
    delete window.location;
    window.location = { href: '' };
  });

  it('attaches the stored bearer token to outgoing requests', () => {
    localStorage.setItem('auth_token', 'my-token');

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer my-token');
  });

  it('does not set an Authorization header when no token is stored', () => {
    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } };

    expect(responseSuccessInterceptor(response)).toBe(response);
  });

  it('clears the token and redirects to /login on a 401 response', async () => {
    localStorage.setItem('auth_token', 'my-token');
    delete window.location;
    window.location = { href: '' };

    const error = { response: { status: 401 }, config: {} };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('does not redirect on non-401 errors', async () => {
    localStorage.setItem('auth_token', 'my-token');

    const error = { response: { status: 500 }, config: {} };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('auth_token')).toBe('my-token');
    expect(window.location.href).toBe('');
  });
});
