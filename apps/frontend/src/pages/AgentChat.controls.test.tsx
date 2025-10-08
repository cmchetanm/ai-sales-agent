import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentChat } from './AgentChat';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));

vi.mock('../api/client', () => ({
  api: {
    apolloStatus: vi.fn().mockResolvedValue({ ok: true, data: { apollo: { mode: 'sample' } } }),
    chatSessionsIndex: vi.fn().mockResolvedValue({ ok: true, data: { chat_sessions: [{ id: 1, status: 'active' }] } }),
    chatSessionShow: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1, status: 'active', messages: [] } } }),
    chatSessionCreate: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 2 } } }),
    chatSessionPause: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1, status: 'paused' } } }),
    chatSessionResume: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1, status: 'active' } } }),
    chatSessionComplete: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1, status: 'completed' } } }),
    chatMessagesCreate: vi.fn().mockResolvedValue({ ok: true, data: { assistant: { content: 'ok' } } }),
  }
}));

describe('AgentChat controls', () => {
  beforeEach(() => {
    // jsdom missing scrollIntoView
    // @ts-ignore
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();
  });

  it('pauses, resumes and completes a session', async () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Agent Chat/i)).toBeInTheDocument();
    const pause = await screen.findByText('Pause');
    fireEvent.click(pause);
    const resume = await screen.findByText('Resume');
    fireEvent.click(resume);
    const complete = await screen.findByText('Complete');
    fireEvent.click(complete);
    // Ensure controls exist and actions invoked without errors
    await waitFor(() => expect(resume).toBeInTheDocument());
  });
});

