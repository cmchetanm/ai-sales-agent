import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Leads } from './Leads';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    leadsIndex: () => Promise.resolve({ ok: true, data: { leads: [{ id: 1, email: 'lead@example.com', status: 'new' }], pagination: {} } }),
    pipelinesIndex: () => Promise.resolve({ ok: true, data: { pipelines: [{ id: 9, name: 'Sales' }] } }),
    leadsCreate: () => Promise.resolve({ ok: true, data: { lead: { id: 2 } } })
  }
}));

describe('Leads page', () => {
  it('renders leads table', async () => {
    render(
      <MemoryRouter>
        <Leads />
      </MemoryRouter>
    );
    expect(await screen.findByText('Leads')).toBeInTheDocument();
    expect(await screen.findByText('lead@example.com')).toBeInTheDocument();
  });
});

