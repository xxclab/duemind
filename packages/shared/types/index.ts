export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

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
}

export interface CreateThingInput {
  title: string;
  category?: Category;
  due_at: string;
  description?: string;
  action?: string;
  tags?: string[];
  recurrence_rule?: string;
  reminders?: CreateReminderInput[];
}

export interface NotificationChannelType =
  | 'email' | 'telegram' | 'webhook' | 'wecom' | 'feishu' | 'dingtalk';

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

export interface CreateChannelInput {
  type: NotificationChannelType;
  name: string;
  config: Record<string, unknown>;
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

export interface CreateReminderInput {
  offset_minutes: number;
  channel_id: string;
}

export interface NotificationLog {
  id: string;
  reminder_id: string | null;
  thing_id: string | null;
  user_id: string;
  channel_id: string | null;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

export type DueUrgency = 'overdue' | 'today' | 'soon' | 'upcoming' | 'later';
