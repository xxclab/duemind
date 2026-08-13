import { Env } from '../types';

export class SupabaseClient {
  private url: string;
  private serviceKey: string;

  constructor(env: Env) {
    this.url = env.SUPABASE_URL;
    this.serviceKey = env.SUPABASE_SERVICE_KEY;
  }

  private async request<T>(
    table: string,
    method: string,
    options?: {
      query?: string;
      body?: unknown;
      headers?: Record<string, string>;
      single?: boolean;
      count?: 'exact' | 'planned' | 'estimated';
    }
  ): Promise<{ data: T | null; error: { message: string; code: string } | null; count: number | null }> {
    let url = `${this.url}/rest/v1/${table}`;

    const headers: Record<string, string> = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': options?.single ? 'return=representation' : 'return=minimal',
      ...options?.headers,
    };

    if (options?.count) {
      headers['Prefer'] += `,count=${options.count}`;
    }

    if (options?.query) {
      url += `?${options.query}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get('content-range');
    let count: number | null = null;
    if (contentType) {
      const match = contentType.match(/\/(\d+)/);
      if (match) count = parseInt(match[1]);
    }

    if (res.status >= 400) {
      const error = await res.json().catch(() => ({ message: res.statusText, code: String(res.status) }));
      return { data: null, error: { message: error.message || res.statusText, code: error.code || String(res.status) }, count };
    }

    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text as unknown as T;
      }
    }

    return { data, error: null, count };
  }

  // Things
  async getThings(userId: string, filters?: { status?: string; category?: string; due_before?: string; due_after?: string; search?: string }) {
    const conditions = [`user_id.eq.${userId}`];
    if (filters?.status) conditions.push(`status.eq.${filters.status}`);
    if (filters?.category) conditions.push(`category.eq.${filters.category}`);
    if (filters?.due_before) conditions.push(`due_at.lte.${filters.due_before}`);
    if (filters?.due_after) conditions.push(`due_at.gte.${filters.due_after}`);
    if (filters?.search) conditions.push(`title.ilike.%${filters.search}%`);

    const select = '*, reminders(channel:notification_channels(id,name,type,config,enabled))';
    const query = conditions.join('&') + `&select=${encodeURIComponent(select)}&order=due_at.asc&limit=100`;
    return this.request('things', 'GET', { query });
  }

  async getThing(id: string) {
    const select = '*, reminders(id,offset_minutes,channel_id,enabled,next_trigger_at,last_sent_at,channel:notification_channels(id,name,type,config,enabled))';
    return this.request('things', 'GET', { query: `id.eq.${id}&select=${encodeURIComponent(select)}`, single: true });
  }

  async createThing(thing: Record<string, unknown>) {
    return this.request('things', 'POST', { body: thing, single: true });
  }

  async updateThing(id: string, updates: Record<string, unknown>) {
    return this.request('things', 'PATCH', { body: updates, query: `id.eq.${id}`, single: true });
  }

  async deleteThing(id: string) {
    return this.request('things', 'DELETE', { query: `id.eq.${id}` });
  }

  // Reminders
  async createReminder(reminder: Record<string, unknown>) {
    return this.request('reminders', 'POST', { body: reminder, single: true });
  }

  async deleteReminder(id: string) {
    return this.request('reminders', 'DELETE', { query: `id.eq.${id}` });
  }

  async getDueReminders(now: string) {
    const select = `*, thing:things(id,title,due_at,category,action,metadata,user_id), channel:notification_channels(id,type,name,config,enabled,user_id)`;
    const query = `next_trigger_at.lte.${now}&enabled.eq.true&select=${encodeURIComponent(select)}&limit=500`;
    return this.request('reminders', 'GET', { query });
  }

  async markReminderSent(id: string) {
    return this.request('reminders', 'PATCH', {
      body: { last_sent_at: new Date().toISOString() },
      query: `id.eq.${id}`,
      single: true,
    });
  }

  // Channels
  async getChannels(userId: string) {
    return this.request('notification_channels', 'GET', {
      query: `user_id.eq.${userId}&order=created_at.asc&select=*&limit=100`,
    });
  }

  async createChannel(channel: Record<string, unknown>) {
    return this.request('notification_channels', 'POST', { body: channel, single: true });
  }

  async updateChannel(id: string, updates: Record<string, unknown>) {
    return this.request('notification_channels', 'PATCH', { body: updates, query: `id.eq.${id}`, single: true });
  }

  async deleteChannel(id: string) {
    return this.request('notification_channels', 'DELETE', { query: `id.eq.${id}` });
  }

  // Profiles
  async getProfile(userId: string) {
    return this.request('profiles', 'GET', {
      query: `id.eq.${userId}&select=*`,
      single: true,
    });
  }

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    return this.request('profiles', 'PATCH', { body: updates, query: `id.eq.${userId}`, single: true });
  }

  async createProfileDirect(userId: string) {
    return this.request('profiles', 'POST', {
      body: { id: userId },
      single: true,
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    });
  }

  // Notification Logs
  async createNotificationLog(log: Record<string, unknown>) {
    return this.request('notification_logs', 'POST', { body: log });
  }

  // Stats
  async getThingsCount(userId: string) {
    const res = await fetch(`${this.url}/rest/v1/things?user_id=eq.${userId}&select=id`, {
      headers: {
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`,
        'Prefer': 'count=exact',
        'Range': '0-0',
      },
    });
    const range = res.headers.get('content-range');
    const match = range?.match(/\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
