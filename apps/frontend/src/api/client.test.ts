import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, apiUrl, api } from './client';

const originalFetch = global.fetch;

describe('api client', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('builds apiUrl correctly', () => {
    expect(apiUrl('/health')).toMatch(/\/health$/);
    expect(apiUrl('http://example.com/x')).toEqual('http://example.com/x');
  });

  it('handles successful json response', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const res = await request('/health');
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
  });

  it('handles error response', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'nope' }), { status: 422 }));
    const res = await request('/bad');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
  });

  it('calls signIn with proper payload', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: 1 }, token: 't' }), { status: 200 }));
    // @ts-ignore
    global.fetch = spy;
    const resp = await api.signIn('a@b.c', 'pw');
    expect(spy).toHaveBeenCalledOnce();
    const body = JSON.parse((spy.mock.calls[0][1].body as string) || '{}');
    expect(body.user).toEqual({ email: 'a@b.c', password: 'pw' });
    expect(resp.ok).toBe(true);
  });
});

