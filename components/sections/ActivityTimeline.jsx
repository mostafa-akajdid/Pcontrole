import { formatDistanceToNow } from 'date-fns';
import { Activity, Plus, Edit, Trash, RotateCcw } from 'lucide-react';

const ACTION_CONFIG = {
  CREATE: { icon: Plus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  UPDATE: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  DELETE: { icon: Trash, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  RESTORE: { icon: RotateCcw, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
};

const ENTITY_LABELS = {
  Project: 'project',
  Blog: 'blog post',
  Media: 'media file',
  User: 'user',
  Role: 'role',
  Setting: 'setting',
};

export default function ActivityTimeline({ data }) {
  const activities = data?.recentActivity || [];

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-gray-400" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Activity Timeline</h3>
        </div>
        <div className="text-center py-8">
          <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No activity recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-gray-400" />
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Activity Timeline</h3>
      </div>
      
      <div className="space-y-1">
        {activities.slice(0, 8).map((item, idx) => {
          const config = ACTION_CONFIG[item.action] || ACTION_CONFIG.UPDATE;
          const Icon = config.icon;
          const entityLabel = ENTITY_LABELS[item.entityType] || item.entityType?.toLowerCase() || 'item';
          
          return (
            <div key={item.id} className="flex items-start gap-3 py-2.5 relative">
              {idx < activities.length - 1 && (
                <div className="absolute left-[15px] top-[32px] w-px h-[calc(100%-24px)] bg-gray-100 dark:bg-gray-700" />
              )}
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                <Icon size={14} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.user?.name || 'System'}</span>
                  {' '}
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.action?.toLowerCase()}d a {entityLabel}
                  </span>
                </p>
                {item.entityName && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">"{item.entityName}"</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
