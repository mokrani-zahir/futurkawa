import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../services/api';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

function Consumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('admin@futurekawa.local', 'secret')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete window.location;
    window.location = { href: '' };
  });

  it('starts unauthenticated with loading false when no token is stored', async () => {
    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('restores the session from a stored token', async () => {
    localStorage.setItem('auth_token', 'existing-token');
    api.get.mockResolvedValue({ data: { id: 1, email: 'admin@futurekawa.local' } });

    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.local');
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('clears an invalid stored token', async () => {
    localStorage.setItem('auth_token', 'stale-token');
    api.get.mockRejectedValue(new Error('unauthenticated'));

    render(<AuthProvider><Consumer /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('login stores the token and sets the user', async () => {
    api.post.mockResolvedValue({
      data: { token: 'new-token', user: { id: 1, email: 'admin@futurekawa.local' } },
    });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.local'));
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@futurekawa.local',
      password: 'secret',
    });
    expect(localStorage.getItem('auth_token')).toBe('new-token');
  });

  it('logout clears the session and redirects to /login', async () => {
    localStorage.setItem('auth_token', 'existing-token');
    api.get.mockResolvedValue({ data: { id: 1, email: 'admin@futurekawa.local' } });
    api.post.mockResolvedValue({});

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.local'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('logout still clears the session even if the API call fails', async () => {
    localStorage.setItem('auth_token', 'existing-token');
    api.get.mockResolvedValue({ data: { id: 1, email: 'admin@futurekawa.local' } });
    api.post.mockRejectedValue(new Error('network error'));

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.local'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeNull());
  });
});
