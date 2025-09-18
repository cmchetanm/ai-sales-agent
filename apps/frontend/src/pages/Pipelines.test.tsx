import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Pipelines } from './Pipelines';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    pipelinesIndex: () => Promise.resolve({ ok: true, data: { pipelines: [{ id: 1, name: 'Sales', status: 'active' }] } }),
    pipelinesCreate: () => Promise.resolve({ ok: true, data: { pipeline: { id: 2 } } })
  }
}));

describe('Pipelines page', () => {
  it('renders heading and table', async () => {
    render(
      <MemoryRouter>
        <Pipelines />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Pipelines/i)).toBeInTheDocument();
    expect(await screen.findByText('Sales')).toBeInTheDocument();
  });
});

