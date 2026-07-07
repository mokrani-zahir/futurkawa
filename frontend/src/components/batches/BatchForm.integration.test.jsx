import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../../services/api';
import BatchForm from './BatchForm';

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('./SensorSelector', () => ({
  default: ({ selected, onChange }) => (
    <button onClick={() => onChange([...selected, 'dht22-t1'])}>select-dht22-t1</button>
  ),
}));

describe('BatchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a batch with the entered name, dates and selected sensors', async () => {
    api.post.mockResolvedValue({});
    const onSaved = vi.fn();

    render(
      <BatchForm
        zoneId="zone-1"
        tokenData={{ token: 'tok', ws_url: 'wss://api.example.com/ws/' }}
        onSaved={onSaved}
        onCancel={vi.fn()}
      />
    );

    await userEvent.type(screen.getByPlaceholderText('Salle de production'), 'Salle 1');
    await userEvent.click(screen.getByText('select-dht22-t1'));
    await userEvent.click(screen.getByRole('button', { name: 'Créer le lot' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith('/batches', expect.objectContaining({
      name: 'Salle 1',
      zone_id: 'zone-1',
      storage_duration_days: 365,
      sensors: ['dht22-t1'],
    }));
  });

  it('converts storage_duration_days to a number', async () => {
    api.post.mockResolvedValue({});

    render(<BatchForm zoneId="zone-1" tokenData={{}} onSaved={vi.fn()} onCancel={vi.fn()} />);

    const durationInput = screen.getByDisplayValue('365');
    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, '30');
    await userEvent.type(screen.getByPlaceholderText('Salle de production'), 'Salle 2');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le lot' }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1].storage_duration_days).toBe(30);
    expect(typeof api.post.mock.calls[0][1].storage_duration_days).toBe('number');
  });

  it('shows the count of selected sensors', async () => {
    render(<BatchForm zoneId="zone-1" tokenData={{}} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByText('select-dht22-t1'));

    expect(screen.getByText('1 sélectionné')).toBeInTheDocument();
  });

  it('displays an error message when creation fails', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Lot déjà existant.' } } });

    render(<BatchForm zoneId="zone-1" tokenData={{}} onSaved={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Salle de production'), 'Salle 1');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le lot' }));

    expect(await screen.findByText('Lot déjà existant.')).toBeInTheDocument();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<BatchForm zoneId="zone-1" tokenData={{}} onSaved={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
