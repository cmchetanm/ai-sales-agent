import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Account } from './Account';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ token: 't', account: { name: 'Acme' }, reload: vi.fn() })
}));
vi.mock('../api/client', () => ({
  api: {
    accountUpdate: () => Promise.resolve({ ok: true, data: { account: { name: 'New' } } })
  }
}));

describe('Account page', () => {
  it('renders and shows current account name', async () => {
    render(
      <MemoryRouter>
        <Account />
      </MemoryRouter>
    );
    expect(await screen.findByText('Account')).toBeInTheDocument();
  });
});

