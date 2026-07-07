import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it.each([
    ['connected', 'Connecté'],
    ['disconnected', 'Déconnecté'],
    ['connecting', 'Connexion…'],
    ['expired', 'Expiré'],
    ['active', 'Actif'],
    ['webhook', 'Webhook'],
    ['storage_expiry', 'Expiration stockage'],
  ])('renders the French label for status "%s"', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('falls back to the raw status value for an unknown status', () => {
    render(<StatusBadge status="mystery" />);
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });
});
