import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink, ShieldAlert, UserCheck, Skull, Info, ChevronRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleToggle = () => {
    if (!isOpen) {
      refreshNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'MORTALITY_ADDED':
      case 'MORTALITY_UPDATED':
      case 'MORTALITY_DELETED':
        return <Skull className="w-4 h-4 text-rose-600" />;
      case 'MANAGER_ACCESS_REQUEST':
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case 'MANAGER_APPROVED':
        return <Check className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-sky-600" />;
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.type === 'MANAGER_ACCESS_REQUEST') {
      navigate('/admin/managers');
    } else if (notif.type === 'MORTALITY_ADDED' || notif.type === 'MORTALITY_UPDATED') {
      navigate('/admin/mortality');
    }
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden transform transition-all duration-150">
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                  {notifications.length} total
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications right now
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start group ${
                    !n.is_read ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 shadow-xs group-hover:border-emerald-300 transition-colors">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 whitespace-pre-line leading-relaxed">
                      {n.message}
                    </p>

                    {n.type === 'MANAGER_ACCESS_REQUEST' && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                          <UserCheck className="w-3 h-3 text-amber-700" />
                          Pending Approval &bull; Click to Review &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {user?.role === 'ADMIN' && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/managers');
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1 w-full py-1 rounded hover:bg-emerald-50 transition-colors"
              >
                <span>Go to Manager Access Approvals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
