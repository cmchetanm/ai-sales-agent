import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentChat } from './AgentChat';

// Mock auth
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));

// Capture subscription handlers
let receivedCb: ((data: any) => void) | null = null;

// Mock ActionCable consumer
vi.mock('../lib/cable', () => ({
  createCable: () => ({
    subscriptions: {
      create: (_identifier: any, handlers: any) => {
        receivedCb = handlers.received;
        return { unsubscribe: vi.fn() };
      },
    },
  }),
}));

// Mock API client for sessions/messages
vi.mock('../api/client', () => ({
  api: {
    chatSessionsIndex: vi.fn().mockResolvedValue({ ok: true, data: { chat_sessions: [{ id: 1, status: 'active' }] } }),
    chatSessionShow: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1, messages: [] } } }),
    chatSessionCreate: vi.fn().mockResolvedValue({ ok: true, data: { chat_session: { id: 1 } } }),
    chatMessagesCreate: vi.fn().mockResolvedValue({ ok: true, data: { assistant: { content: 'hi' } } }),
    chatMessagesIndex: vi.fn().mockResolvedValue({ ok: true, data: { messages: [] } }),
  },
}));

describe('AgentChat ActionCable', () => {
  // jsdom doesn't implement scrollIntoView
  // @ts-ignore
  if (!Element.prototype.scrollIntoView) (Element.prototype.scrollIntoView as any) = vi.fn();
  it('appends incoming cable messages in real time', async () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>
    );
    // Wait for initial session load
    await waitFor(() => expect(receivedCb).toBeTypeOf('function'));
    // Simulate server push
    receivedCb?.({ event: 'message.created', message: { id: 99, role: 'assistant', content: 'From Cable', sent_at: new Date().toISOString() } });
    expect(await screen.findByText('From Cable')).toBeInTheDocument();
  });
});
