import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PipelineBoard } from './PipelineBoard';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));

const updateMock = vi.fn(() => Promise.resolve({ ok: true }));
vi.mock('../api/client', () => ({
  api: {
    leadsIndex: () => Promise.resolve({ ok: true, data: { leads: [
      { id: 1, email: 'x@y.com', status: 'new', company: 'Acme', job_title: 'CTO' },
    ] } }),
    leadsUpdate: (...args: any[]) => updateMock(...args),
  }
}));

describe('PipelineBoard interactions', () => {
  it('allows moving status via chips', async () => {
    render(
      <MemoryRouter>
        <PipelineBoard pipelineId={1} />
      </MemoryRouter>
    );
    // Wait for the lead card to render under NEW column
    const card = await screen.findByText(/x@y.com/i);
    // Find one of the action chips (first available)
    const chip = screen.getAllByRole('button').find((b) => /researching|enriched|outreach|scheduled/.test(b.textContent || ''));
    expect(chip).toBeTruthy();
    if (chip) fireEvent.click(chip);
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
  });
});

