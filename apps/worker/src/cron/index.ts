import { SupabaseClient } from '../lib/supabase';
import { sendNotification } from './send';

export async function runCron(env: Env): Promise<{ processed: number; errors: number }> {
  const db = new SupabaseClient(env);
  const now = new Date().toISOString();

  const result = await db.getDueReminders(now);
  if (result.error || !result.data) {
    console.error('Failed to fetch due reminders:', result.error);
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const reminder of result.data as Array<{
    id: string;
    thing_id: string;
    user_id: string;
    channel_id: string;
    next_trigger_at: string;
    last_sent_at: string | null;
    thing: {
      id: string;
      title: string;
      due_at: string;
      category: string;
      action: string | null;
      metadata: Record<string, unknown>;
      user_id: string;
    };
    channel: {
      id: string;
      type: string;
      name: string;
      config: Record<string, unknown>;
      enabled: boolean;
    };
  }>) {
    // Skip if already sent
    if (reminder.last_sent_at && reminder.next_trigger_at <= reminder.last_sent_at) {
      continue;
    }

    const { thing, channel } = reminder;
    if (!channel || !channel.enabled) continue;

    const dueDate = new Date(thing.due_at);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const action = thing.action || 'Check';

    let urgency: string;
    if (daysUntil < 0) urgency = `🔴 OVERDUE by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
    else if (daysUntil === 0) urgency = '🔴 TODAY';
    else if (daysUntil <= 3) urgency = `🟠 In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
    else if (daysUntil <= 7) urgency = `🟡 In ${daysUntil} days`;
    else urgency = `🟢 In ${daysUntil} days`;

    const body = `${urgency}\n\n📋 ${thing.title}\n📅 Due: ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n→ ${action}`;

    const sendResult = await sendNotification({
      type: channel.type,
      name: channel.name,
      config: channel.config,
      title: `DueMind Reminder`,
      body,
    });

    if (sendResult.success) {
      await db.markReminderSent(reminder.id);
      await db.createNotificationLog({
        reminder_id: reminder.id,
        thing_id: reminder.thing_id,
        user_id: reminder.user_id,
        channel_id: reminder.channel_id,
        status: 'sent',
      });
      processed++;
    } else {
      console.error(`Failed to send notification for reminder ${reminder.id}:`, sendResult.error);
      await db.createNotificationLog({
        reminder_id: reminder.id,
        thing_id: reminder.thing_id,
        user_id: reminder.user_id,
        channel_id: reminder.channel_id,
        status: 'failed',
        error_message: sendResult.error,
      });
      errors++;
    }
  }

  console.log(`Cron completed: ${processed} sent, ${errors} errors`);
  return { processed, errors };
}
