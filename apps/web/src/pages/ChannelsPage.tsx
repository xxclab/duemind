import { useState, useEffect } from 'react';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';
import { ChannelForm } from '../components/ChannelForm';
import type { NotificationChannel } from '../types';

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  telegram: '✈️',
  email: '✉️',
  webhook: '🔗',
  wecom: '💬',
  feishu: '🐦',
  dingtalk: '📢',
};

export function ChannelsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChannels = () => {
    api.channels.list().then(setChannels).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchChannels(); }, []);

  const handleCreate = async (data: { type: string; name: string; config: Record<string, unknown> }) => {
    await api.channels.create(data);
    setShowForm(false);
    fetchChannels();
  };

  const handleToggle = async (channel: NotificationChannel) => {
    await api.channels.update(channel.id, { enabled: !channel.enabled });
    fetchChannels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel?')) return;
    await api.channels.delete(id);
    fetchChannels();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Notification Channels</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Add Channel</button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <ChannelForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No channels configured</p>
          <p className="text-sm mt-1">Add a channel to receive reminders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(channel => (
            <div key={channel.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{CHANNEL_TYPE_ICONS[channel.type] || '📌'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{channel.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{channel.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(channel)} className="p-1">
                  {channel.enabled ? (
                    <ToggleRight className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <button onClick={() => handleDelete(channel.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
