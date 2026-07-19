import { useState, useEffect } from 'react';
import { Bell, Trash2, AlertCircle, Info, Settings, FileText, User } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';
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

export default function NotificationPanel({ onClose, onMarkAllRead, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 8;

  const fetchNotifications = async (pageNum = 1) => {
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&perPage=${perPage}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.items);
        setTotal(json.data.pagination.totalPages);
        if (onCountChange) {
          const unread = json.data.items.filter((n) => !n.readAt).length;
          onCountChange(json.data.pagination.totalItems);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to delete notifications:', err);
    }
  };

  const getIcon = (type) => {
    const Icon = typeIcons[type] || Bell;
    return Icon;
  };

  return (
    <div className="w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
          {selected.size > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selected.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => { onMarkAllRead(); setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))); }}
            className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const isUnread = !notification.readAt;
            return (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                  isUnread ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => {
                  toggleSelect(notification.id);
                  if (isUnread) markAsRead(notification.id);
                }}
              >
                <div className="mt-0.5 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${priorityColors[notification.priority] || 'text-gray-500 bg-gray-100'}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400">{getRelativeTime(notification.createdAt)}</span>
                    {notification.entityType && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{notification.entityType}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page >= total}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
