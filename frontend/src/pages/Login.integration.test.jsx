import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email and password fields', () => {
    useAuth.mockReturnValue({ login: vi.fn() });

    render(<Login />);

    expect(screen.getByPlaceholderText('admin@futurekawa.local')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('logs in and navigates to the dashboard on success', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, email: 'admin@futurekawa.local' });
    useAuth.mockReturnValue({ login });

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText('admin@futurekawa.local'), 'admin@futurekawa.local');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('admin@futurekawa.local', 'secret'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('shows an error message and does not navigate when login fails', async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { message: 'Les identifiants sont incorrects.' } } });
    useAuth.mockReturnValue({ login });

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText('admin@futurekawa.local'), 'admin@futurekawa.local');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Les identifiants sont incorrects.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the API gives none', async () => {
    const login = vi.fn().mockRejectedValue(new Error('network down'));
    useAuth.mockReturnValue({ login });

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText('admin@futurekawa.local'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Identifiants incorrects.')).toBeInTheDocument();
  });
});
