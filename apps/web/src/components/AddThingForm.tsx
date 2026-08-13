import { useRef } from 'react';

interface AddThingFormProps {
  onSubmit: (data: {
    title: string;
    due_at: string;
    category: string;
    action: string;
    description: string;
    reminders: { offset_minutes: number; channel_id: string }[];
  }) => void;
  onCancel: () => void;
  channels: Array<{ id: string; name: string; type: string }>;
  loading?: boolean;
}

const PRESET_REMINDERS = [
  { label: '30d', minutes: 43200 },
  { label: '7d', minutes: 10080 },
  { label: '1d', minutes: 1440 },
  { label: '1h', minutes: 60 },
  { label: '0', minutes: 0 },
];

export function AddThingForm({ onSubmit, onCancel, channels, loading }: AddThingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current!;
    const formData = new FormData(form);

    const title = formData.get('title') as string;
    const due_at = formData.get('due_at') as string;
    const category = formData.get('category') as string;
    const action = formData.get('action') as string;
    const description = formData.get('description') as string;

    const reminders: { offset_minutes: number; channel_id: string }[] = [];
    for (const r of PRESET_REMINDERS) {
      const key = `reminder_${r.minutes}`;
      const channelId = formData.get(key) as string;
      if (channelId) {
        reminders.push({ offset_minutes: r.minutes, channel_id: channelId });
      }
    }

    onSubmit({ title, due_at, category, action, description, reminders });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card p-6">
      <h2 className="text-lg font-semibold mb-6">Add a reminder</h2>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What do you want to remember?</label>
          <input name="title" required className="input" placeholder="e.g. Cloudflare domain, Mom's birthday..." autoFocus />
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">When?</label>
          <input name="due_at" type="date" required className="input" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" defaultValue="other" className="input">
            <option value="other">Other</option>
            <option value="domain">Domain</option>
            <option value="certificate">Certificate</option>
            <option value="token">Token</option>
            <option value="subscription">Subscription</option>
            <option value="service">Service</option>
            <option value="license">License</option>
            <option value="warranty">Warranty</option>
            <option value="food">Food</option>
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
            <option value="document">Document</option>
          </select>
        </div>

        {/* Action */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What should you do?</label>
          <select name="action" defaultValue="other" className="input">
            <option value="renew">Renew</option>
            <option value="rotate">Rotate</option>
            <option value="cancel">Cancel</option>
            <option value="replace">Replace</option>
            <option value="buy">Buy</option>
            <option value="pay">Pay</option>
            <option value="check">Check</option>
            <option value="discard">Discard</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
          <textarea name="description" rows={2} className="input" placeholder="Any notes..." />
        </div>

        {/* Reminders */}
        {channels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remind me</label>
            <div className="space-y-2">
              {PRESET_REMINDERS.map(r => (
                <div key={r.minutes} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">{r.label} before</span>
                  <select name={`reminder_${r.minutes}`} className="input flex-1 text-sm">
                    <option value="">Don't remind</option>
                    {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No channels warning */}
        {channels.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Set up a notification channel first to receive reminders.
            <a href="/channels" className="underline font-medium ml-1">Add channel →</a>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  );
}
