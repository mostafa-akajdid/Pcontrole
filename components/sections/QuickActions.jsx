import Link from 'next/link';
import { Plus, FileText, Newspaper, Upload, Users, Settings } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAppearance } from '@/contexts/AppearanceContext';

const ACTIONS = [
  { label: 'New Project', href: '/dashboard/projects', icon: FileText, permission: 'projects.create', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { label: 'New Blog Post', href: '/dashboard/blogs', icon: Newspaper, permission: 'blogs.create', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
  { label: 'Upload Media', href: '/dashboard/media', icon: Upload, permission: 'media.create', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  { label: 'Manage Users', href: '/dashboard/users', icon: Users, permission: 'users.read', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings.read', color: 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' },
];

export default function QuickActions() {
  const { can } = usePermission();
  const { accentColor } = useAppearance();

  const allowedActions = ACTIONS.filter(action => can(action.permission));

  if (allowedActions.length === 0) return null;

  return (
    <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4 shrink-0">Quick Actions</h3>
      
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {allowedActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} transition-transform group-hover:scale-105`}>
                <Icon size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {action.label}
              </span>
              <Plus size={14} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
