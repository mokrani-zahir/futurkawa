import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlertItem from './AlertItem';

const baseAlert = {
  id: 'a1',
  type: 'webhook',
  title: 'Alerte capteur : dht22-t1',
  message: 'Valeur mesurée : 23.6',
  sensor_name: 'dht22-t1',
  zone: { name: 'Usine A' },
  is_resolved: false,
  created_at: '2026-07-01T10:00:00Z',
};

describe('AlertItem', () => {
  it('renders the compact variant with title, zone and type badge', () => {
    render(<AlertItem alert={baseAlert} compact />);

    expect(screen.getByText(baseAlert.title)).toBeInTheDocument();
    expect(screen.getByText(/Usine A/)).toBeInTheDocument();
    expect(screen.getByText('Webhook')).toBeInTheDocument();
  });

  it('renders the full variant with message and a resolve button', () => {
    const onResolve = vi.fn();
    render(<AlertItem alert={baseAlert} onResolve={onResolve} />);

    expect(screen.getByText(baseAlert.message)).toBeInTheDocument();
    expect(screen.getByText('Zone : Usine A')).toBeInTheDocument();
    expect(screen.getByText('Capteur : dht22-t1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Résoudre/ })).toBeInTheDocument();
  });

  it('calls onResolve with the alert when the resolve button is clicked', async () => {
    const onResolve = vi.fn().mockResolvedValue();
    render(<AlertItem alert={baseAlert} onResolve={onResolve} />);

    await userEvent.click(screen.getByRole('button', { name: /Résoudre/ }));

    expect(onResolve).toHaveBeenCalledWith(baseAlert);
  });

  it('does not render a resolve button once the alert is resolved', () => {
    const resolved = {
      ...baseAlert,
      is_resolved: true,
      resolved_at: '2026-07-01T12:00:00Z',
      resolved_by: { name: 'Admin' },
    };
    render(<AlertItem alert={resolved} onResolve={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Résoudre/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Résolu le/)).toBeInTheDocument();
    expect(screen.getByText(/par Admin/)).toBeInTheDocument();
  });

  it('does not render a resolve button when no onResolve handler is given', () => {
    render(<AlertItem alert={baseAlert} />);

    expect(screen.queryByRole('button', { name: /Résoudre/ })).not.toBeInTheDocument();
  });
});
