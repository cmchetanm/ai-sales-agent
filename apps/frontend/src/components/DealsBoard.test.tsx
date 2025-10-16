import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DealsBoard } from './DealsBoard';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    dealsIndex: () => Promise.resolve({ ok: true, data: { deals: [
      { id: 1, name: 'Opp 1', amount_cents: 10000, currency: 'USD', stage: 'qualification' },
      { id: 2, name: 'Opp 2', amount_cents: 20000, currency: 'EUR', stage: 'proposal' }
    ] } }),
    dealsUpdate: () => Promise.resolve({ ok: true }),
  }
}));

describe('DealsBoard', () => {
  it('renders stage columns and totals', async () => {
    render(
      <MemoryRouter>
        <DealsBoard />
      </MemoryRouter>
    );
    expect(await screen.findByText('QUALIFICATION')).toBeInTheDocument();
    expect(await screen.findByText('PROPOSAL')).toBeInTheDocument();
  });
});

