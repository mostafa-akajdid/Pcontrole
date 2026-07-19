import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function RemindersCard({ data }) {
  const { accentColor } = useAppearance();
  const activity = data?.recentActivity || [];
  
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return '🟢';
      case 'UPDATE': return '🔵';
      case 'DELETE': return '🔴';
      case 'RESTORE': return '🟡';
      default: return '⚪';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'CREATE': return 'created';
      case 'UPDATE': return 'updated';
      case 'DELETE': return 'deleted';
      case 'RESTORE': return 'restored';
      default: return action?.toLowerCase();
    }
  };

  const getEntityLabel = (entityType) => {
    switch (entityType) {
      case 'Project': return 'a project';
      case 'Blog': return 'a blog post';
      case 'Media': return 'a media file';
      case 'User': return 'a user';
      case 'Role': return 'a role';
      default: return entityType?.toLowerCase() || 'an item';
    }
  };

  return (
    <div className="h-[400px] bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Recent Activity</h3>
        <Link href="/dashboard/projects" className="text-xs border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {activity.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
          </div>
        ) : (
          activity.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-lg mt-0.5">{getActionIcon(item.action)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.user?.name || 'System'}</span>
                  {' '}{getActionLabel(item.action)} {getEntityLabel(item.entityType)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.entityName && (
                    <span className="font-medium text-gray-500 dark:text-gray-400">"{item.entityName}"</span>
                  )}
                  {' · '}
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
