import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RequireAuth from './RequireAuth';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('shows a loading indicator while the session is being resolved', () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    renderWithRoutes();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    renderWithRoutes();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useAuth.mockReturnValue({ user: { id: 1, email: 'admin@futurekawa.local' }, loading: false });

    renderWithRoutes();

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
