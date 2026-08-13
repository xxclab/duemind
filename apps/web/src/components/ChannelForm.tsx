interface ChannelFormProps {
  onSubmit: (data: { type: string; name: string; config: Record<string, unknown> }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CHANNEL_TYPES = [
  { value: 'telegram', label: '✈️ Telegram', fields: ['bot_token', 'chat_id'] },
  { value: 'email', label: '✉️ Email', fields: ['email'] },
  { value: 'webhook', label: '🔗 Webhook', fields: ['url'] },
  { value: 'wecom', label: '💬 WeCom', fields: ['webhook_url'] },
  { value: 'feishu', label: '🐦 Feishu', fields: ['webhook_url'] },
  { value: 'dingtalk', label: '📢 DingTalk', fields: ['webhook_url'] },
];

export function ChannelForm({ onSubmit, onCancel, loading }: ChannelFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const type = formData.get('type') as string;
    const name = formData.get('name') as string;
    const config: Record<string, unknown> = {};

    // Collect config fields
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('config_') && value) {
        const configKey = key.replace('config_', '');
        config[configKey] = value;
      }
    }

    onSubmit({ type, name, config });
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="text-lg font-semibold mb-6">Add notification channel</h2>

      <div className="space-y-5">
        {/* Channel type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select name="type" required className="input">
            {CHANNEL_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input name="name" required className="input" placeholder="e.g. My Telegram Bot" />
        </div>

        {/* Config fields - shown via JS below or all */}
        {CHANNEL_TYPES.map(ct => (
          <div key={ct.value} data-fields-for={ct.value}>
            {ct.fields.map(field => (
              <div key={field} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <input
                  name={`config_${field}`}
                  className="input"
                  placeholder={field === 'bot_token' ? '123456:ABC-DEF...' : field === 'chat_id' ? '-1001234567890' : 'https://...'}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Channel'}
          </button>
        </div>
      </div>
    </form>
  );
}
