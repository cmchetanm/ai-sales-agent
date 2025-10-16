import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Deals } from './Deals';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    dealsIndex: () => Promise.resolve({ ok: true, data: { deals: [{ id: 1, name: 'New Opp', stage: 'qualification', amount_cents: 10000, currency: 'USD' }] } }),
    dealsUpdate: () => Promise.resolve({ ok: true }),
    dealsCreate: () => Promise.resolve({ ok: true, data: { deal: { id: 2 } } })
  }
}));

describe('Deals page', () => {
  it('renders deals table', async () => {
    render(
      <MemoryRouter>
        <Deals />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Deals/i)).toBeInTheDocument();
    expect(await screen.findByText('New Opp')).toBeInTheDocument();
  });
});

