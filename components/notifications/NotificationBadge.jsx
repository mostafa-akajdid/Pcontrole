import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPanel from '@/components/notifications/NotificationPanel';

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const { hasPermission } = useAuth();
  const panelRef = useRef(null);

  const canRead = hasPermission('notifications.read');

  useEffect(() => {
    if (!canRead) return;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count');
        const json = await res.json();
        if (json.success) {
          setUnreadCount(json.data.unreadCount);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [canRead]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelOpen && panelRef.current && !panelRef.current.contains(event.target)) {
        closePanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  const closePanel = () => {
    setPanelClosing(true);
    setTimeout(() => {
      setPanelOpen(false);
      setPanelClosing(false);
    }, 200);
  };

  const togglePanel = () => {
    if (panelOpen) {
      closePanel();
    } else {
      setPanelOpen(true);
      setPanelClosing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleCountChange = (count) => {
    setUnreadCount(count);
  };

  if (!canRead) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={togglePanel}
        className="relative p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition-all duration-200 hover:shadow-md"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className={`absolute right-0 mt-2 z-50 origin-top-right ${
          panelClosing ? 'animate-dropdownSlideOut' : 'animate-dropdownSlideIn'
        }`}>
          <NotificationPanel
            onClose={closePanel}
            onMarkAllRead={handleMarkAllRead}
            onCountChange={handleCountChange}
          />
        </div>
      )}
    </div>
  );
}
