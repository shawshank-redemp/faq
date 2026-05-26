'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const notificationIcons = {
  new_answer: '💬',
  answer_accepted: '✅',
  upvote: '👍',
  downvote: '👎',
  comment: '💭',
  mention: '@',
  follow: '👤',
  badge: '🏅',
  system: '🔔',
  moderation: '⚡',
  faq_update: '📖',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const archiveNotification = async (id) => {
    try {
      await api.put(`/notifications/${id}/archive`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!user) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center">
      <p className="text-gray-500">Please login to view notifications</p>
      <Link href="/auth?mode=login" className="btn-primary mt-4 inline-block">Login</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm">Mark all as read</button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`card p-4 flex items-start gap-3 transition-colors ${
                !notification.isRead ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <span className="text-xl shrink-0">{notificationIcons[notification.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                {notification.link ? (
                  <Link href={notification.link} className="hover:text-primary-600" onClick={() => {
                    if (!notification.isRead) {
                      api.put('/notifications/read', { ids: [notification._id] }).catch(() => {});
                    }
                  }}>
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>{notification.title}</p>
                  </Link>
                ) : (
                  <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>{notification.title}</p>
                )}
                {notification.message && <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
              </div>
              <button
                onClick={() => archiveNotification(notification._id)}
                className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
                title="Archive"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
