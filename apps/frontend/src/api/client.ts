export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000';

export function apiUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: any;
}

import i18n from '../i18n';

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  // Propagate user locale to backend
  try { headers['Accept-Language'] = (i18n?.language || 'en').split('-')[0]; } catch {}
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  let body: any = undefined;
  try {
    body = await res.json();
  } catch (_) {}
  if (!res.ok) {
    // Global auth handling: if unauthorized/forbidden, clear token and redirect to login
    if (res.status === 401 || res.status === 419) {
      try { localStorage.removeItem('auth_token'); } catch {}
      try {
        const lang = (i18n?.language || 'en').split('-')[0];
        const isLogin = typeof window !== 'undefined' && /\/login$/.test(window.location.pathname);
        // Preserve the originally requested path so we can return after login
        const next = typeof window !== 'undefined' && !isLogin ? encodeURIComponent(window.location.pathname + window.location.search) : '';
        const loginPath = `/${lang}/login?expired=1${next ? `&next=${next}` : ''}`;
        if (typeof window !== 'undefined' && !isLogin) {
          // Avoid infinite redirects from login route itself
          window.location.assign(loginPath);
        }
      } catch {}
    }
    return { ok: false, status: res.status, error: body ?? await res.text() };
  }
  return { ok: true, status: res.status, data: body };
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>('/api/v1/health'),
  dashboard: (token: string) => request<{ leads: any; campaigns: any }>(
    '/api/v1/dashboard',
    {},
    token
  ),
  signIn: (email: string, password: string) =>
    request<{ user: any; token: string }>(
      '/api/v1/auth/sign_in',
      { method: 'POST', body: JSON.stringify({ user: { email, password } }) }
    ),
  signUp: (account: { name: string; plan_slug?: string }, user: { email: string; password: string; password_confirmation: string; first_name?: string; last_name?: string }) =>
    request<{ account: any; user: any; token: string }>(
      '/api/v1/auth/sign_up',
      { method: 'POST', body: JSON.stringify({ account, user }) }
    ),
  profile: (token: string) => request<{ user: any; account: any }>('/api/v1/auth/profile', {}, token),
  signOut: (token: string) => request<void>('/api/v1/auth/sign_out', { method: 'DELETE' }, token),
  accountShow: (token: string) => request<{ account: any }>('/api/v1/account', {}, token),
  accountUpdate: (token: string, attrs: any) => request<{ account: any }>(
    '/api/v1/account',
    { method: 'PATCH', body: JSON.stringify({ account: attrs }) },
    token
  ),
  pipelinesIndex: (token: string, params: Record<string, any> = {}) => request<{ pipelines: any[]; pagination: any }>(
    `/api/v1/pipelines${toQS(params)}`,
    {},
    token
  ),
  pipelinesCreate: (token: string, attrs: any) => request<{ pipeline: any }>(
    '/api/v1/pipelines',
    { method: 'POST', body: JSON.stringify({ pipeline: attrs }) },
    token
  ),
  pipelinesUpdate: (token: string, id: number, attrs: any) => request<{ pipeline: any }>(
    `/api/v1/pipelines/${id}`,
    { method: 'PATCH', body: JSON.stringify({ pipeline: attrs }) },
    token
  ),
  pipelinesDelete: (token: string, id: number) => request<void>(
    `/api/v1/pipelines/${id}`,
    { method: 'DELETE' },
    token
  ),
  leadsIndex: (token: string, params: Record<string, any> = {}) => request<{ leads: any[]; pagination: any }>(
    `/api/v1/leads${toQS(params)}`,
    {},
    token
  ),
  leadsExport: async (token: string, params: Record<string, any> = {}): Promise<Blob> => {
    const url = apiUrl(`/api/v1/leads/export${toQS(params)}`);
    const headers: Record<string, string> = { Accept: 'text/csv' };
    try { headers['Accept-Language'] = (i18n as any)?.language?.split('-')[0] || 'en'; } catch {}
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return await res.blob();
  },
  leadsCreate: (token: string, attrs: any) => request<{ lead: any }>(
    '/api/v1/leads',
    { method: 'POST', body: JSON.stringify({ lead: attrs }) },
    token
  ),
  leadsUpdate: (token: string, id: number, attrs: any) => request<{ lead: any }>(
    `/api/v1/leads/${id}`,
    { method: 'PATCH', body: JSON.stringify({ lead: attrs }) },
    token
  ),
  leadsQualify: (token: string, id: number) => request<{ status: string }>(
    `/api/v1/leads/${id}/qualify`,
    { method: 'POST' },
    token
  ),
  leadsActivitiesIndex: (token: string, leadId: number, params: Record<string, any> = {}) => request<{ activities: any[]; pagination?: any }>(
    `/api/v1/leads/${leadId}/activities${toQS(params)}`,
    {},
    token
  ),
  leadsActivitiesCreate: (token: string, leadId: number, attrs: any) => request<{ activity: any }>(
    `/api/v1/leads/${leadId}/activities`,
    { method: 'POST', body: JSON.stringify({ activity: attrs }) },
    token
  ),
  leadsDelete: (token: string, id: number) => request<void>(
    `/api/v1/leads/${id}`,
    { method: 'DELETE' },
    token
  ),
  campaignsIndex: (token: string, params: Record<string, any> = {}) => request<{ campaigns: any[]; pagination: any }>(
    `/api/v1/campaigns${toQS(params)}`,
    {},
    token
  ),
  campaignsCreate: (token: string, attrs: any) => request<{ campaign: any }>(
    '/api/v1/campaigns',
    { method: 'POST', body: JSON.stringify({ campaign: attrs }) },
    token
  ),
  campaignsUpdate: (token: string, id: number, attrs: any) => request<{ campaign: any }>(
    `/api/v1/campaigns/${id}`,
    { method: 'PATCH', body: JSON.stringify({ campaign: attrs }) },
    token
  ),
  campaignsDelete: (token: string, id: number) => request<void>(
    `/api/v1/campaigns/${id}`,
    { method: 'DELETE' },
    token
  ),
  campaignsPreview: (token: string, id: number) => request<{ campaign_id: number; target_count: number }>(
    `/api/v1/campaigns/${id}/preview`,
    {},
    token
  ),
  campaignsStart: (token: string, id: number) => request<{ campaign: any }>(
    `/api/v1/campaigns/${id}/start`,
    { method: 'POST' },
    token
  ),
  campaignsPause: (token: string, id: number) => request<{ campaign: any }>(
    `/api/v1/campaigns/${id}/pause`,
    { method: 'POST' },
    token
  ),
  chatSessionCreate: (token: string) => request<{ chat_session: { id: number } }>(
    '/api/v1/chat_sessions',
    { method: 'POST' },
    token
  ),
  chatSessionsIndex: (token: string) => request<{ chat_sessions: { id: number; status: string }[] }>(
    '/api/v1/chat_sessions',
    {},
    token
  ),
  chatSessionShow: (token: string, id: number) => request<{ chat_session: { id: number; messages: any[] } }>(
    `/api/v1/chat_sessions/${id}`,
    {},
    token
  ),
  chatSessionPause: (token: string, id: number) => request<{ chat_session: { id: number; status: string } }>(
    `/api/v1/chat_sessions/${id}/pause`,
    { method: 'POST' },
    token
  ),
  chatSessionResume: (token: string, id: number) => request<{ chat_session: { id: number; status: string } }>(
    `/api/v1/chat_sessions/${id}/resume`,
    { method: 'POST' },
    token
  ),
  chatSessionComplete: (token: string, id: number) => request<{ chat_session: { id: number; status: string } }>(
    `/api/v1/chat_sessions/${id}/complete`,
    { method: 'POST' },
    token
  ),
  chatMessagesIndex: (token: string, chatSessionId: number) => request<{ messages: any[] }>(
    `/api/v1/chat_sessions/${chatSessionId}/messages`,
    {},
    token
  ),
  chatMessagesCreate: (token: string, chatSessionId: number, content: string) => request<{ user: any; assistant: any }>(
    `/api/v1/chat_sessions/${chatSessionId}/messages`,
    { method: 'POST', body: JSON.stringify({ message: { content } }) },
    token
  ),
  apolloFetch: (token: string, filters: Record<string, any>) => request<{ status: string }>(
    '/api/v1/integrations/apollo',
    { method: 'POST', body: JSON.stringify({ filters }) },
    token
  ),
  apolloStatus: (token: string) => request<{ apollo: { enabled: boolean; ready: boolean; has_key: boolean; mode: 'live'|'sample'|'unauthorized', probe?: { ok: boolean; status: number; hint: string } } }>(
    '/api/v1/integrations/status?probe=true',
    {},
    token
  ),
  // Lightweight fallback (no probe) if the status endpoint is unavailable
  apolloStatusSimple: (token: string) => request<{ enabled: boolean; ready: boolean; has_key: boolean; mode: 'live'|'sample'|'unauthorized' }>(
    '/api/v1/integrations/apollo',
    {},
    token
  ),
  discoverLeads: (token: string, filters: Record<string, any>) => request<{ status: string }>(
    '/api/v1/integrations/discover',
    { method: 'POST', body: JSON.stringify({ filters }) },
    token
  ),
  usersIndex: (token: string, params: Record<string, any> = {}) => request<{ users: any[] }>(
    `/api/v1/users${toQS(params)}`,
    {},
    token
  ),
  pipelinesStats: (token: string, id: number) => request<{ pipeline_id: number; stage_stats: any[]; status_counts: Record<string, number> }>(
    `/api/v1/pipelines/${id}/stats`,
    {},
    token
  ),
  leadsBulkUpdate: (token: string, ids: number[], attrs: any) => request<{ updated: number }>(
    '/api/v1/leads/bulk_update',
    { method: 'PATCH', body: JSON.stringify({ ids, lead: attrs }) },
    token
  ),
  leadsImport: (token: string, csv: string, opts: { pipeline_id?: number; assigned_user_id?: number } = {}) => request<{ status: string }>(
    '/api/v1/leads/import',
    { method: 'POST', body: JSON.stringify({ csv, ...opts }) },
    token
  ),
};

function toQS(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const search = new URLSearchParams(entries as any).toString();
  return `?${search}`;
}
