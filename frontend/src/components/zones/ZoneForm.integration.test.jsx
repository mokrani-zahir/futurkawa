import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../../services/api';
import ZoneForm from './ZoneForm';

vi.mock('../../services/api', () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));

describe('ZoneForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new zone from the filled-in fields', async () => {
    api.post.mockResolvedValue({});
    const onSaved = vi.fn();

    render(<ZoneForm onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('Usine A'), 'Usine B');
    await userEvent.type(screen.getByPlaceholderText('http://example.com'), 'https://b.example.com');
    await userEvent.type(screen.getByPlaceholderText('admin'), 'zoneuser');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'zonepass');
    await userEvent.click(screen.getByRole('button', { name: 'Créer la zone' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith('/zones', {
      name: 'Usine B',
      api_url: 'https://b.example.com',
      api_username: 'zoneuser',
      api_password: 'zonepass',
    });
  });

  it('prefills fields when editing an existing zone', () => {
    const zone = { id: 'z1', name: 'Usine A', api_url: 'https://a.example.com', api_username: 'admin' };

    render(<ZoneForm zone={zone} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByPlaceholderText('Usine A')).toHaveValue('Usine A');
    expect(screen.getByPlaceholderText('http://example.com')).toHaveValue('https://a.example.com');
    expect(screen.getByPlaceholderText('admin')).toHaveValue('admin');
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeInTheDocument();
  });

  it('updates a zone and omits the password field when left blank', async () => {
    api.put.mockResolvedValue({});
    const zone = { id: 'z1', name: 'Usine A', api_url: 'https://a.example.com', api_username: 'admin' };
    const onSaved = vi.fn();

    render(<ZoneForm zone={zone} onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.put).toHaveBeenCalledWith('/zones/z1', {
      name: 'Usine A',
      api_url: 'https://a.example.com',
      api_username: 'admin',
    });
  });

  it('displays the aggregated validation errors returned by the API', async () => {
    api.post.mockRejectedValue({
      // The URL field uses HTML5 type="url" validation, which blocks submission
      // client-side for syntactically invalid values before React ever sees it —
      // so this response models a rejection the *backend* would raise instead
      // (e.g. a duplicate name), not a malformed URL.
      response: { data: { errors: { name: ['Ce nom est déjà utilisé.'], api_url: ['URL invalide.'] } } },
    });

    render(<ZoneForm onSaved={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Usine A'), 'X');
    await userEvent.type(screen.getByPlaceholderText('http://example.com'), 'https://example.com');
    await userEvent.type(screen.getByPlaceholderText('admin'), 'u');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'p');
    await userEvent.click(screen.getByRole('button', { name: 'Créer la zone' }));

    expect(await screen.findByText('Ce nom est déjà utilisé. URL invalide.')).toBeInTheDocument();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<ZoneForm onSaved={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
