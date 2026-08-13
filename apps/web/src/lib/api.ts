import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API client for worker endpoints
const API_BASE = import.meta.env.VITE_API_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers as Record<string, string> },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}

// Things API
export const api = {
  things: {
    list: (filters?: Record<string, string>) => {
      const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
      return apiFetch<any[]>('/api/things' + params);
    },
    get: (id: string) => apiFetch<any>(`/api/things/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch<any>('/api/things', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<any>(`/api/things/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/things/${id}`, { method: 'DELETE' }),
    complete: (id: string) =>
      apiFetch<any>(`/api/things/${id}/complete`, { method: 'POST' }),
    dismiss: (id: string) =>
      apiFetch<any>(`/api/things/${id}/dismiss`, { method: 'POST' }),
    addReminder: (thingId: string, data: { offset_minutes: number; channel_id: string }) =>
      apiFetch<any>(`/api/things/${thingId}/reminders`, { method: 'POST', body: JSON.stringify(data) }),
    deleteReminder: (thingId: string, reminderId: string) =>
      apiFetch<{ deleted: boolean }>(`/api/things/${thingId}/reminders/${reminderId}`, { method: 'DELETE' }),
  },
  channels: {
    list: () => apiFetch<any[]>('/api/channels'),
    create: (data: Record<string, unknown>) =>
      apiFetch<any>('/api/channels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<any>(`/api/channels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/channels/${id}`, { method: 'DELETE' }),
  },
  profile: {
    get: () => apiFetch<any>('/api/profile'),
    update: (data: Record<string, unknown>) =>
      apiFetch<any>('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
