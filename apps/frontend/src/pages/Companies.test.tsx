import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Companies } from './Companies';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    companiesIndex: () => Promise.resolve({ ok: true, data: { companies: [{ id: 1, name: 'Acme', domain: 'acme.test', contacts_count: 1, deals_count: 2 }] } }),
    companiesCreate: () => Promise.resolve({ ok: true, data: { company: { id: 2 } } }),
    companiesDelete: () => Promise.resolve({ ok: true }),
  }
}));

describe('Companies page', () => {
  it('renders companies table', async () => {
    render(
      <MemoryRouter>
        <Companies />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Companies/i)).toBeInTheDocument();
    expect(await screen.findByText('Acme')).toBeInTheDocument();
  });
});

