import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Campaigns } from './Campaigns';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    campaignsIndex: () => Promise.resolve({ ok: true, data: { campaigns: [{ id: 1, name: 'Welcome Series', status: 'draft' }] } }),
    pipelinesIndex: () => Promise.resolve({ ok: true, data: { pipelines: [] } }),
    campaignsCreate: () => Promise.resolve({ ok: true, data: { campaign: { id: 2 } } })
  }
}));

describe('Campaigns page', () => {
  it('renders campaigns table', async () => {
    render(
      <MemoryRouter>
        <Campaigns />
      </MemoryRouter>
    );
    // Title or main control visible
    expect(await screen.findByText(/New Campaign/i)).toBeInTheDocument();
    expect(await screen.findByText('Welcome Series')).toBeInTheDocument();
  });
});
