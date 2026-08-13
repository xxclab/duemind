import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.profile.get().then((profile: any) => {
      if (profile) {
        setDisplayName(profile.display_name || '');
        setTimezone(profile.timezone || 'UTC');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.profile.update({ display_name: displayName, timezone });
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Settings</h2>

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              className="input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option value="UTC">UTC</option>
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6 mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Account</h3>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>
    </div>
  );
}
