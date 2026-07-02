import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConnectionsStatus from './ConnectionsStatus';

describe('ConnectionsStatus', () => {
  const zones = [
    { id: 'z1', name: 'Usine A', api_url: 'https://a.example.com' },
    { id: 'z2', name: 'Usine B', api_url: 'https://b.example.com' },
  ];

  it('renders each zone with its status', () => {
    render(
      <MemoryRouter>
        <ConnectionsStatus zones={zones} statuses={{ z1: 'connected', z2: 'connecting' }} />
      </MemoryRouter>
    );

    expect(screen.getByText('Usine A')).toBeInTheDocument();
    expect(screen.getByText('Connecté')).toBeInTheDocument();
    expect(screen.getByText('Usine B')).toBeInTheDocument();
    expect(screen.getByText('Connexion…')).toBeInTheDocument();
  });

  it('defaults to disconnected when a zone has no known status', () => {
    render(
      <MemoryRouter>
        <ConnectionsStatus zones={zones} statuses={{}} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Déconnecté')).toHaveLength(2);
  });

  it('links each zone name to its detail page', () => {
    render(
      <MemoryRouter>
        <ConnectionsStatus zones={zones} statuses={{}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Usine A').closest('a')).toHaveAttribute('href', '/zones/z1');
  });
});
