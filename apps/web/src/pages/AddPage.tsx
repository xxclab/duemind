import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Bell, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { AddThingForm } from '../components/AddThingForm';
import type { NotificationChannel } from '../types';

export function AddPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.channels.list()
      .then(setChannels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (data: {
    title: string;
    due_at: string;
    category: string;
    action: string;
    description: string;
    reminders: { offset_minutes: number; channel_id: string }[];
  }) => {
    setSubmitting(true);
    try {
      await api.things.create({
        ...data,
        due_at: new Date(data.due_at).toISOString(),
      });
      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/')} className="btn-ghost gap-1 mb-4 -ml-1">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <AddThingForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        channels={channels}
        loading={submitting}
      />
    </div>
  );
}
