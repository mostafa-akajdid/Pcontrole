import { useState, useEffect } from 'react';
import { Bell, FileText, User, Settings, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const typeIcons = {
  content: FileText,
  user: User,
  system: Settings,
  error: AlertCircle,
  info: Info,
};

const priorityColors = {
  HIGH: 'text-red-500 bg-red-50',
  MEDIUM: 'text-amber-500 bg-amber-50',
  LOW: 'text-blue-500 bg-blue-50',
};

export default function RecentNotifications({ data }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (data?.recentNotifications) {
      setNotifications(data.recentNotifications);
    }
  }, [data]);

  const getRelativeTime = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="h-[350px] flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-gray-800 text-sm">Recent Notifications</h3>
          <Link href="/dashboard/notifications" className="text-xs text-blue-500 hover:text-blue-700">
            View all
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-gray-400">
          <Bell size={24} className="mb-2" />
          <p className="text-sm">No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold text-gray-800 text-sm">Recent Notifications</h3>
        <Link href="/dashboard/notifications" className="text-xs text-blue-500 hover:text-blue-700">
          View all
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          const isUnread = !n.readAt;
          return (
            <div key={n.id} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isUnread ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${priorityColors[n.priority] || 'text-gray-500 bg-gray-100'}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'} line-clamp-1`}>{n.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                <span className="text-[10px] text-gray-400">{getRelativeTime(n.createdAt)}</span>
              </div>
              {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
