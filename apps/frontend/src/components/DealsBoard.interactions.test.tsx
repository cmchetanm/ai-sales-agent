import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DealsBoard } from './DealsBoard';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));

const updateMock = vi.fn(() => Promise.resolve({ ok: true }));
vi.mock('../api/client', () => ({
  api: {
    dealsIndex: () => Promise.resolve({ ok: true, data: { deals: [
      { id: 1, name: 'Opp 1', amount_cents: 10000, currency: 'USD', stage: 'qualification', contact: { email: 'a@b.com' } },
    ] } }),
    dealsUpdate: (...args: any[]) => updateMock(...args),
  }
}));

describe('DealsBoard interactions', () => {
  it('allows quick Won action', async () => {
    render(
      <MemoryRouter>
        <DealsBoard />
      </MemoryRouter>
    );
    const card = await screen.findByText('Opp 1');
    const box = card.closest('div');
    expect(box).toBeTruthy();
    const chip = await screen.findByText('Won');
    fireEvent.click(chip);
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
  });
});

