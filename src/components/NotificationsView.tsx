import React from 'react';
import { Bell, Check, Trash2, MailOpen } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsView({
  notifications,
  onMarkAsRead,
  onClearAll
}: NotificationsViewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Notifications Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-primary" />
            <span>Club Notifications</span>
          </h2>
          <p className="text-on-surface-variant font-sans text-xs mt-1">
            Real-time match verifications, challenge proposals, and Elo tier adjustments.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors uppercase font-bold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-brand-surface border border-brand-outline rounded-2xl overflow-hidden shadow-2xl">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm flex flex-col items-center gap-3">
            <MailOpen className="w-8 h-8 text-on-surface-variant opacity-60" />
            <p className="font-medium">No active notifications.</p>
            <p className="text-xs">Incoming club alerts and matching triggers will display here.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-outline">
            {notifications.map(item => (
              <div
                key={item.id}
                className={`p-5 transition-all outline-none flex items-start justify-between gap-4 h-fit ${
                  item.unread ? 'bg-brand-surface-high/35 border-l-4 border-brand-primary' : 'bg-transparent'
                }`}
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white">{item.title}</p>
                    {item.unread && (
                      <span className="bg-brand-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans">{item.message}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium font-mono mt-2 block">{item.time}</p>
                </div>

                {item.unread && (
                  <button
                    onClick={() => onMarkAsRead(item.id)}
                    className="flex justify-center items-center bg-brand-surface-lowest hover:bg-brand-primary hover:text-black hover:border-brand-primary text-on-surface border border-brand-outline p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
