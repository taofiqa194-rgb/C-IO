import React, { useState } from 'react';
import { AppNotification } from '../types';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Trash2, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (notif: AppNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'deal':
        return <Sparkles className="h-4 w-4 text-[#5A5A40]" />;
      default:
        return <Info className="h-4 w-4 text-sky-600" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMin = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div
        id="notifications-modal-card"
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E0E0D5] shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E0E0D5] bg-[#FAF9F6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center shadow-xs">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-[#5A5A40] text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7A7A6A]">
                Campus marketplace updates & alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#7A7A6A] hover:bg-[#E8E8DF] transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-5 py-2.5 bg-[#F5F5F0] border-b border-[#E0E0D5] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-bold transition ${
                filter === 'all'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full font-bold transition ${
                filter === 'unread'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#5A5A40] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1 rounded-md text-[#A0A090] hover:text-rose-600 transition"
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-3 sm:p-4 divide-y divide-[#E0E0D5] flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="h-8 w-8 text-[#A0A090] mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-serif font-bold text-[#2D2D2A]">No notifications yet</h4>
              <p className="text-xs text-[#7A7A6A] mt-1 max-w-xs mx-auto">
                Campus safety updates, listing approvals, inquiries, and expiration notices will appear here.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3 sm:p-3.5 rounded-2xl transition cursor-pointer flex items-start gap-3 my-1 ${
                  item.read ? 'bg-white hover:bg-[#F5F5F0]' : 'bg-[#E8E8DF]/40 hover:bg-[#E8E8DF]/70 border border-[#5A5A40]/15'
                }`}
              >
                {/* Type Icon */}
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E0E0D5] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-[#2D2D2A] truncate">{item.title}</h5>
                    <div className="flex items-center gap-1 text-[10px] text-[#A0A090] shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{formatTime(item.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5A5A40] mt-0.5 leading-relaxed">
                    {item.message}
                  </p>

                  {item.linkAction && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#5A5A40] hover:underline">
                      <span>View details</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Unread indicator dot */}
                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-[#5A5A40] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
