import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Bus } from 'lucide-react';
import { StatCard } from '../components/StatCard';

describe('StatCard', () => {
  it('renders value and title', () => {
    render(<StatCard icon={<Bus />} value="42" title="Aktif Araç" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Aktif Araç')).toBeInTheDocument();
  });

  it('renders trend badge when provided', () => {
    render(<StatCard icon={<Bus />} value="18.4%" title="Yakıt Tasarrufu" trend="up" subtext="Geçen haftaya göre" />);
    expect(screen.getByText('18.4%')).toBeInTheDocument();
    expect(screen.getByText('%12')).toBeInTheDocument();
    expect(screen.getByText('Geçen haftaya göre')).toBeInTheDocument();
  });

  it('renders down trend with red styling', () => {
    render(<StatCard icon={<Bus />} value="5" title="Uyarı" trend="down" />);
    const badge = screen.getByText('%8');
    expect(badge).toBeInTheDocument();
  });
});
