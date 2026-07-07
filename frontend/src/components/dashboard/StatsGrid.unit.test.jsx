import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsGrid from './StatsGrid';

describe('StatsGrid', () => {
  it('renders nothing when stats is null', () => {
    const { container } = render(<StatsGrid stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each stat value from the given object', () => {
    render(<StatsGrid stats={{
      zones_count: 3,
      batches_count: 7,
      active_alerts: 2,
      resolved_alerts: 5,
      expired_batches: 1,
    }} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Zones')).toBeInTheDocument();
    expect(screen.getByText('Lots expirés')).toBeInTheDocument();
  });

  it('defaults missing keys to 0', () => {
    render(<StatsGrid stats={{}} />);
    expect(screen.getAllByText('0')).toHaveLength(5);
  });
});
