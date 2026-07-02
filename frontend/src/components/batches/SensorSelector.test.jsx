import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SensorSelector from './SensorSelector';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('SensorSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a message when no token is available yet', () => {
    render(<SensorSelector zoneApiUrl="https://api.example.com" token={null} selected={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/Token JWT non disponible/)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('fetches and renders the sensor list', async () => {
    axios.get.mockResolvedValue({ data: [{ nom: 'dht22-t1', type: 'temperature' }, { nom: 'bmp280-p1' }] });

    render(<SensorSelector zoneApiUrl="https://api.example.com" token="tok" selected={[]} onChange={vi.fn()} />);

    expect(await screen.findByText('dht22-t1')).toBeInTheDocument();
    expect(screen.getByText('bmp280-p1')).toBeInTheDocument();
    expect(screen.getByText('temperature')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/lot',
      { headers: { Authorization: 'Bearer tok' } }
    );
  });

  it('shows an error message when the request fails', async () => {
    axios.get.mockRejectedValue(new Error('network'));

    render(<SensorSelector zoneApiUrl="https://api.example.com" token="tok" selected={[]} onChange={vi.fn()} />);

    expect(await screen.findByText(/Impossible de récupérer les capteurs/)).toBeInTheDocument();
  });

  it('shows a message when no sensors are returned', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<SensorSelector zoneApiUrl="https://api.example.com" token="tok" selected={[]} onChange={vi.fn()} />);

    expect(await screen.findByText(/Aucun capteur trouvé/)).toBeInTheDocument();
  });

  it('calls onChange with the sensor added when an unselected checkbox is clicked', async () => {
    axios.get.mockResolvedValue({ data: [{ nom: 'dht22-t1' }] });
    const onChange = vi.fn();

    render(<SensorSelector zoneApiUrl="https://api.example.com" token="tok" selected={[]} onChange={onChange} />);
    await screen.findByText('dht22-t1');

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(['dht22-t1']);
  });

  it('calls onChange with the sensor removed when an already-selected checkbox is clicked', async () => {
    axios.get.mockResolvedValue({ data: [{ nom: 'dht22-t1' }] });
    const onChange = vi.fn();

    render(<SensorSelector zoneApiUrl="https://api.example.com" token="tok" selected={['dht22-t1']} onChange={onChange} />);
    await screen.findByText('dht22-t1');

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
