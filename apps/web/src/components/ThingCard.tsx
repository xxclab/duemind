import { useNavigate } from 'react-router-dom';
import {
  Check, X, ChevronRight,
} from 'lucide-react';
import { Thing, getUrgency, getDaysUntil, formatDueDate, CATEGORY_ICONS, getUrgencyLabel } from '../types';

const urgencyStyles: Record<string, string> = {
  overdue: 'border-l-red-500 bg-red-50/50',
  today: 'border-l-orange-500 bg-orange-50/50',
  soon: 'border-l-orange-500',
  upcoming: 'border-l-yellow-500',
  later: 'border-l-green-500',
};

const urgencyDot: Record<string, string> = {
  overdue: 'bg-red-500',
  today: 'bg-orange-500',
  soon: 'bg-orange-500',
  upcoming: 'bg-yellow-500',
  later: 'bg-green-500',
};

const urgencyText: Record<string, string> = {
  overdue: 'text-red-700',
  today: 'text-orange-700',
  soon: 'text-orange-600',
  upcoming: 'text-yellow-700',
  later: 'text-green-700',
};

export function ThingCard({ thing, onComplete, onDismiss }: {
  thing: Thing;
  onComplete?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const urgency = getUrgency(thing.due_at);
  const daysUntil = getDaysUntil(thing.due_at);
  const dueLabel = formatDueDate(thing.due_at);
  const actionLabel = thing.action || 'Check';
  const categoryIcon = CATEGORY_ICONS[thing.category] || '📌';

  return (
    <div
      className={`card border-l-4 ${urgencyStyles[urgency]} p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => navigate(`/thing/${thing.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-lg mt-0.5">{categoryIcon}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{thing.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgencyText[urgency]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot[urgency]}`} />
                {daysUntil < 0
                  ? `Overdue by ${Math.abs(daysUntil)}d`
                  : daysUntil === 0
                    ? 'Today'
                    : `${daysUntil}d left`}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{dueLabel}</span>
            </div>
            {thing.action && (
              <p className="text-xs text-gray-500 mt-1">
                → {actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        </div>
      </div>

      {(onComplete || onDismiss) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {onComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(thing.id); }}
              className="btn-ghost text-green-600 text-xs gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(thing.id); }}
              className="btn-ghost text-gray-400 text-xs gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
