import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit3, Check, X, Bell, BellOff, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { getUrgency, getDaysUntil, formatDueDate, CATEGORY_ICONS } from '../types';
import type { Thing, NotificationChannel, Reminder } from '../types';

export function ThingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thing, setThing] = useState<Thing | null>(null);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.things.get(id),
      api.channels.list(),
    ]).then(([thingData, channelsData]) => {
      setThing(thingData);
      setChannels(channelsData || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    if (!id) return;
    await api.things.complete(id);
    navigate('/');
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this?')) return;
    await api.things.delete(id);
    navigate('/');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await api.things.update(id, editData);
    setEditing(false);
    const updated = await api.things.get(id);
    setThing(updated);
  };

  const handleAddReminder = async () => {
    if (!id || channels.length === 0) return;
    const channel = channels[0];
    await api.things.addReminder(id, { offset_minutes: 1440, channel_id: channel.id });
    const updated = await api.things.get(id);
    setThing(updated);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!id) return;
    await api.things.deleteReminder(id, reminderId);
    const updated = await api.things.get(id);
    setThing(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!thing) return <p className="text-gray-500">Not found</p>;

  const urgency = getUrgency(thing.due_at);
  const daysUntil = getDaysUntil(thing.due_at);
  const categoryIcon = CATEGORY_ICONS[thing.category] || '📌';

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(false)} className="btn-ghost gap-1 mb-4 -ml-1">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <form onSubmit={handleUpdate} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input" defaultValue={thing.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input type="date" className="input" defaultValue={thing.due_at.split('T')[0]} onChange={e => setEditData({ ...editData, due_at: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="input" defaultValue={thing.category} onChange={e => setEditData({ ...editData, category: e.target.value })}>
              <option value="other">Other</option>
              <option value="domain">Domain</option>
              <option value="certificate">Certificate</option>
              <option value="token">Token</option>
              <option value="subscription">Subscription</option>
              <option value="service">Service</option>
              <option value="birthday">Birthday</option>
              <option value="document">Document</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input className="input" defaultValue={thing.action || ''} onChange={e => setEditData({ ...editData, action: e.target.value })} placeholder="e.g. Renew, Rotate..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input" rows={3} defaultValue={thing.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/')} className="btn-ghost gap-1 mb-4 -ml-1">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <h1 className="text-xl font-bold">{thing.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${
                  urgency === 'overdue' ? 'text-red-600' :
                  urgency === 'today' ? 'text-orange-600' :
                  urgency === 'soon' ? 'text-orange-500' :
                  'text-gray-500'
                }`}>
                  {formatDueDate(thing.due_at)}
                </span>
                {thing.action && (
                  <span className="text-sm text-gray-400">→ {thing.action}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Reminders</h3>
            <button onClick={handleAddReminder} className="btn-ghost text-xs gap-1 text-indigo-600">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {thing.reminders && thing.reminders.length > 0 ? (
            <div className="space-y-2">
              {thing.reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.enabled ? <Bell className="w-3.5 h-3.5 text-indigo-500" /> : <BellOff className="w-3.5 h-3.5 text-gray-400" />}
                    <span className="text-gray-600">
                      {r.offset_minutes === 0 ? 'At due time' : `${r.offset_minutes / 1440}d before`}
                    </span>
                    {r.channel && <span className="text-gray-400">· {r.channel.name}</span>}
                  </div>
                  <button onClick={() => handleDeleteReminder(r.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No reminders set</p>
          )}
        </div>

        {/* Description */}
        {thing.description && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{thing.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
          {thing.status === 'pending' && (
            <button onClick={handleComplete} className="btn-primary gap-1">
              <Check className="w-4 h-4" /> Done
            </button>
          )}
          <button onClick={() => setEditing(true)} className="btn-secondary gap-1">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={handleDelete} className="btn-danger gap-1 ml-auto">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
