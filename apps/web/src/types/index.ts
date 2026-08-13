export type Category =
  | 'domain' | 'certificate' | 'token' | 'subscription'
  | 'service' | 'license' | 'warranty' | 'food'
  | 'birthday' | 'anniversary' | 'document' | 'other';

export type Status = 'pending' | 'done' | 'dismissed' | 'expired';

export interface Thing {
  id: string;
  user_id: string;
  title: string;
  category: Category;
  due_at: string;
  description: string | null;
  action: string | null;
  status: Status;
  tags: string[];
  recurrence_rule: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  reminders?: Reminder[];
}

export type NotificationChannelType = 'email' | 'telegram' | 'webhook' | 'wecom' | 'feishu' | 'dingtalk';

export interface NotificationChannel {
  id: string;
  user_id: string;
  type: NotificationChannelType;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  thing_id: string;
  user_id: string;
  offset_minutes: number;
  channel_id: string;
  enabled: boolean;
  next_trigger_at: string | null;
  last_sent_at: string | null;
  created_at: string;
  channel?: NotificationChannel;
}

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
}

export type DueUrgency = 'overdue' | 'today' | 'soon' | 'upcoming' | 'later';

export function getUrgency(dueAt: string): DueUrgency {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const diff = due - now;
  const days = diff / (1000 * 60 * 60 * 24);

  if (days < 0) return 'overdue';
  if (days < 1) return 'today';
  if (days <= 3) return 'soon';
  if (days <= 7) return 'upcoming';
  return 'later';
}

export function getUrgencyLabel(urgency: DueUrgency): string {
  switch (urgency) {
    case 'overdue': return 'OVERDUE';
    case 'today': return 'TODAY';
    case 'soon': return 'SOON';
    case 'upcoming': return 'UPCOMING';
    case 'later': return 'LATER';
  }
}

export function getDaysUntil(dueAt: string): number {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

export function formatDueDate(dueAt: string): string {
  const date = new Date(dueAt);
  const now = new Date();
  const days = getDaysUntil(dueAt);

  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const CATEGORY_ICONS: Record<Category, string> = {
  domain: '🌐',
  certificate: '🔐',
  token: '🔑',
  subscription: '💳',
  service: '☁️',
  license: '📄',
  warranty: '🛡️',
  food: '🍎',
  birthday: '🎂',
  anniversary: '🎉',
  document: '📋',
  other: '📌',
};

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'other', label: 'Other' },
  { value: 'domain', label: 'Domain' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'token', label: 'Token' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'service', label: 'Service' },
  { value: 'license', label: 'License' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'food', label: 'Food' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'document', label: 'Document' },
];

export const ACTION_OPTIONS = [
  { value: 'renew', label: 'Renew' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'replace', label: 'Replace' },
  { value: 'buy', label: 'Buy' },
  { value: 'pay', label: 'Pay' },
  { value: 'check', label: 'Check' },
  { value: 'discard', label: 'Discard' },
  { value: 'other', label: 'Other' },
];
