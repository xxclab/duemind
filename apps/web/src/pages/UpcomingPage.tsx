import { useState, useEffect, useMemo } from 'react';
import { Thing, getUrgency, getDaysUntil, formatDueDate, CATEGORY_ICONS, getUrgencyLabel } from '../types';
import { ThingCard } from '../components/ThingCard';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Greeting } from '../components/Greeting';

interface UpcomingPageProps {
  showAll?: boolean;
  showDone?: boolean;
}

export function UpcomingPage({ showAll = false, showDone = false }: UpcomingPageProps) {
  const { user } = useAuth();
  const [things, setThings] = useState<Thing[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const filters: Record<string, string> = {};
        if (showDone) filters.status = 'done';
        else if (!showAll) {
          // Upcoming: only pending things
          filters.status = 'pending';
        }

        const [thingsData, profileData] = await Promise.all([
          api.things.list(filters),
          api.profile.get().catch(() => null),
        ]);
        setThings(thingsData || []);
        if (profileData) setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, showAll, showDone]);

  // Group by urgency
  const grouped = useMemo(() => {
    if (showDone) return { done: things };
    if (showAll) {
      const pending = things.filter(t => t.status === 'pending');
      const dismissed = things.filter(t => t.status === 'dismissed');
      const done = things.filter(t => t.status === 'done');
      return { ...groupByUrgency(pending), dismissed, done };
    }
    return groupByUrgency(things.filter(t => t.status === 'pending'));
  }, [things, showAll, showDone]);

  const handleComplete = async (id: string) => {
    try {
      await api.things.complete(id);
      setThings(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.things.dismiss(id);
      setThings(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
    );
  }

  // Done page
  if (showDone) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Completed ({grouped.done.length})</h2>
        {grouped.done.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {grouped.done.map(thing => (
              <ThingCard key={thing.id} thing={thing} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Upcoming page
  return (
    <div>
      {!showAll && <Greeting name={profile?.display_name} />}
      {showAll && <h2 className="text-lg font-semibold mb-4 text-gray-700">All items</h2>}

      {!showAll && things.length === 0 && <EmptyState />}

      {!showAll && things.length > 0 && (
        <div className="space-y-6">
          {(['overdue', 'today', 'soon', 'upcoming', 'later'] as const).map(urgency => {
            const items = grouped[urgency];
            if (!items?.length) return null;
            return (
              <div key={urgency}>
                <h3 className={`text-xs font-semibold tracking-wider mb-3 ${
                  urgency === 'overdue' ? 'text-red-600' :
                  urgency === 'today' ? 'text-orange-600' :
                  urgency === 'soon' ? 'text-orange-500' :
                  urgency === 'upcoming' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {urgency === 'overdue' ? '🔴 OVERDUE' :
                   urgency === 'today' ? '🟠 TODAY' :
                   urgency === 'soon' ? '🟠 SOON' :
                   urgency === 'upcoming' ? '🟡 UPCOMING' :
                   '🟢 LATER'}
                </h3>
                <div className="space-y-3">
                  {items.map(thing => (
                    <ThingCard
                      key={thing.id}
                      thing={thing}
                      onComplete={handleComplete}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All page */}
      {showAll && (
        <div className="space-y-6">
          {(['overdue', 'today', 'soon', 'upcoming', 'later'] as const).map(urgency => {
            const items = grouped[urgency];
            if (!items?.length) return null;
            return (
              <div key={urgency}>
                <h3 className="text-xs font-semibold tracking-wider mb-3 text-gray-500">
                  {urgency === 'overdue' ? '🔴 OVERDUE' :
                   urgency === 'today' ? '🟠 TODAY' :
                   urgency === 'soon' ? '🟠 SOON' :
                   urgency === 'upcoming' ? '🟡 UPCOMING' :
                   '🟢 LATER'}
                </h3>
                <div className="space-y-3">
                  {items.map(thing => (
                    <ThingCard key={thing.id} thing={thing} onComplete={handleComplete} onDismiss={handleDismiss} />
                  ))}
                </div>
              </div>
            );
          })}
          {grouped.dismissed?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold tracking-wider mb-3 text-gray-400">DISMISSED</h3>
              <div className="space-y-3">
                {grouped.dismissed.map(thing => (
                  <ThingCard key={thing.id} thing={thing} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function groupByUrgency(things: Thing[]) {
  const groups: Record<string, Thing[]> = {
    overdue: [],
    today: [],
    soon: [],
    upcoming: [],
    later: [],
  };
  for (const thing of things) {
    const urgency = getUrgency(thing.due_at);
    groups[urgency].push(thing);
  }
  return groups;
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">🎉</div>
      <p className="text-gray-500">Nothing needs your attention</p>
      <a href="/add" className="btn-primary mt-4 inline-flex">Add something</a>
    </div>
  );
}
