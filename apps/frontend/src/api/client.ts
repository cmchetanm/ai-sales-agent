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

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...options.headers,
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  let body: any = undefined;
  try {
    body = await res.json();
  } catch (_) {}
  if (!res.ok) return { ok: false, status: res.status, error: body ?? await res.text() };
  return { ok: true, status: res.status, data: body };
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>('/api/v1/health'),
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
  leadsIndex: (token: string, params: Record<string, any> = {}) => request<{ leads: any[]; pagination: any }>(
    `/api/v1/leads${toQS(params)}`,
    {},
    token
  ),
  leadsCreate: (token: string, attrs: any) => request<{ lead: any }>(
    '/api/v1/leads',
    { method: 'POST', body: JSON.stringify({ lead: attrs }) },
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
};

function toQS(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const search = new URLSearchParams(entries as any).toString();
  return `?${search}`;
}

