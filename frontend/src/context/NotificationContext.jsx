import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { notificationService } from '../services/notification.service';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { info, warning } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const pollTimerRef = useRef(null);

  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (!isAuthenticated || !user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [list, countData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      const newCount = countData.unread_count;
      
      // If new unread arrived during polling, trigger alert toast
      if (!isInitial && newCount > prevUnreadRef.current && list.length > 0) {
        const latest = list[0];
        if (!latest.is_read) {
          if (latest.type === 'MORTALITY_ADDED') {
            warning(`${latest.title}: ${latest.message.split('\n')[0]} - ${latest.message.split('\n')[4] || ''}`, 6000);
          } else {
            info(`${latest.title}: ${latest.message}`, 5000);
          }
        }
      }

      prevUnreadRef.current = newCount;
      setNotifications(list);
      setUnreadCount(newCount);
    } catch (err) {
      // Quietly ignore polling failures
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, user?.id, info, warning]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch once on mount/login
    fetchNotifications(true);

    // WebSocket listener for real-time events
    let ws = null;
    let fallbackTimer = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${user.id}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = () => {
        fetchNotifications(false);
      };

      ws.onerror = () => {
        if (!fallbackTimer) {
          fallbackTimer = setInterval(() => fetchNotifications(false), 60000);
        }
      };

      ws.onclose = () => {
        if (!fallbackTimer) {
          fallbackTimer = setInterval(() => fetchNotifications(false), 60000);
        }
      };
    } catch (e) {
      fallbackTimer = setInterval(() => fetchNotifications(false), 60000);
    }

    // Refresh when user returns to this browser tab
    const handleFocus = () => fetchNotifications(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (ws) ws.close();
    };
  }, [isAuthenticated, user?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications: () => fetchNotifications(false),
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
