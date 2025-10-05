import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentChat } from './AgentChat';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    chatSessionsIndex: vi.fn(),
    chatSessionShow: vi.fn(),
    chatSessionCreate: vi.fn(),
    chatMessagesCreate: vi.fn(),
  }
}));

describe('AgentChat page', () => {
  beforeEach(async () => {
    // jsdom doesn't implement scrollIntoView
    // @ts-ignore
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();
    const mod1 = await import('../api/client');
    const a1: any = mod1.api as any;
    a1.chatSessionsIndex.mockResolvedValue({ ok: true, data: { chat_sessions: [{ id: 1, status: 'active' }] } });
    a1.chatSessionShow.mockResolvedValue({ ok: true, data: { chat_session: { id: 1, messages: [] } } });
    a1.chatSessionCreate.mockResolvedValue({ ok: true, data: { chat_session: { id: 2 } } });
    a1.chatMessagesCreate.mockResolvedValue({ ok: true, data: { user: { content: 'hi' }, assistant: { content: 'Here are some leads. Are you satisfied with these results?' } } });
  });

  it('renders and loads a chat session', async () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Agent Chat/i)).toBeInTheDocument();
    // Should call to list sessions and show one option in selector
    const mod = await import('../api/client');
    await waitFor(() => expect(mod.api.chatSessionsIndex).toHaveBeenCalled());
  });

  it('creates a new session via New Session chip', async () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>
    );
    const chip = await screen.findByText(/New Session/i);
    fireEvent.click(chip);
    const mod = await import('../api/client');
    await waitFor(() => expect(mod.api.chatSessionCreate).toHaveBeenCalled());
  });

  it('sends a message and shows satisfaction chips', async () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>
    );
    // Wait until initial session loaded, then get input by role
    const mod = await import('../api/client');
    await waitFor(() => expect(mod.api.chatSessionShow).toHaveBeenCalled());
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'Find CTOs in US' } });
    const sendIcon = screen.getByTestId('SendIcon');
    fireEvent.click(sendIcon.closest('button') as Element);
    const mod2 = await import('../api/client');
    await waitFor(() => expect(mod2.api.chatMessagesCreate).toHaveBeenCalled());
    // Assistant response contains 'Are you satisfied' → Yes/No chips appear
    expect(await screen.findByText(/Yes/i)).toBeInTheDocument();
    expect(screen.getByText(/fetch more/i)).toBeInTheDocument();
  });
});
