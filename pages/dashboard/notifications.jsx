import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bell, CheckCheck, Trash2, Filter,Check, AlertCircle, Info, Settings, FileText, User, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';

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

const priorityLabels = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const toast = useToast();
  const perPage = 10;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (filterType !== 'all') params.set('type', filterType);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterType === 'unread') params.set('unreadOnly', 'true');

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.items);
        setTotalPages(json.data.pagination.totalPages);
        setTotalItems(json.data.pagination.totalItems);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [page, filterType, filterPriority]);

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      fetchStats();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      fetchStats();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Notification deleted');
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to delete notification');
      }
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${selected.size} notification${selected.size !== 1 ? 's' : ''} deleted`);
        setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));
        setSelected(new Set());
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to delete notifications');
      }
    } catch {
      toast.error('Failed to delete notifications');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getRelativeTime = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <DashboardLayout title="Notifications" description="View and manage your notifications.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Stay informed about activity across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-800' },
          { label: 'Unread', value: stats.unread, color: 'text-red-500' },
          { label: 'Today', value: stats.today, color: 'text-blue-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="content">Content</option>
            <option value="user">User</option>
            <option value="system">System</option>
            <option value="unread">Unread</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} /> Delete ({selected.size})
            </button>
          )}
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium mb-1">No notifications found</p>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const isUnread = !notification.readAt;
              return (
                <div
                  key={notification.id}
                  className={`px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                    isUnread ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${priorityColors[notification.priority] || 'text-gray-500 bg-gray-100'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notification.title}</h3>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{getRelativeTime(notification.createdAt)}</span>
                      {notification.entityType && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{notification.entityType}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[notification.priority]}`}>
                        {priorityLabels[notification.priority]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
