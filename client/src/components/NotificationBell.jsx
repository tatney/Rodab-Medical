import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../api';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 20 });
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const safeRoutes = ['/', '/services', '/find-doctor', '/login', '/signup', '/dashboard', '/ambulance', '/appointments', '/consultations', '/forms', '/form-history', '/repeat-prescription', '/illness-certificate', '/fees', '/policies', '/about-us', '/profile', '/super-admin', '/admin', '/doctor', '/driver', '/faqs', '/privacy-policy']

  const handleNotificationClick = (notification) => {
    if (notification.link && safeRoutes.some(r => notification.link === r || notification.link.startsWith(r + '/'))) {
      navigate(notification.link);
    }
    setOpen(false);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      emergency: { color: '#dc2626', bg: '#fef2f2', letter: '!' },
      appointment: { color: '#2563eb', bg: '#eff6ff', letter: 'A' },
      consultation: { color: '#7c3aed', bg: '#f5f3ff', letter: 'C' },
      ambulance: { color: '#d97706', bg: '#fffbeb', letter: 'M' },
      system: { color: '#6b7280', bg: '#f3f4f6', letter: 'S' },
    };
    return icons[type] || icons.system;
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button onClick={handleToggle} style={styles.bellButton} aria-label="Notifications" aria-haspopup="true" aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Escape' && open) { setOpen(false); } }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown} role="menu" aria-label="Notifications"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              const items = e.currentTarget.querySelectorAll('[role="menuitem"]');
              if (items.length === 0) return;
              const arr = Array.from(items);
              const idx = arr.indexOf(document.activeElement);
              let next;
              if (e.key === 'ArrowDown') {
                next = idx < arr.length - 1 ? idx + 1 : 0;
              } else {
                next = idx > 0 ? idx - 1 : arr.length - 1;
              }
              arr[next].focus();
            }
          }}
        >
          <div style={styles.dropdownHeader}>
            <h3 style={styles.dropdownTitle}>Notifications</h3>
          </div>

          <div style={styles.dropdownDivider} />

          <div style={styles.notificationList}>
            {loading ? (
              <div style={styles.emptyState} role="status" aria-live="polite">
                <div style={styles.miniSpinner} aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={styles.emptyState} role="status" aria-live="polite">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>No notifications</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const iconInfo = getNotificationIcon(notif.type);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={styles.notificationItem}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    <div
                      style={{
                        ...styles.notifIcon,
                        backgroundColor: iconInfo.bg,
                        color: iconInfo.color,
                      }}
                    >
                      {iconInfo.letter}
                    </div>
                    <div style={styles.notifContent}>
                      <div style={styles.notifTitle}>{notif.title || 'Notification'}</div>
                      <div style={styles.notifMessage}>{notif.message || ''}</div>
                      <div style={styles.notifTime}>{formatTime(notif.created_at)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <>
              <div style={styles.dropdownDivider} />
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setOpen(false);
                }}
                style={styles.viewAllBtn}
                role="menuitem"
                tabIndex={-1}
              >
                View All Notifications
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 'min(380px, 90vw)',
    maxHeight: '500px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
  },
  dropdownTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  notificationList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '380px',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s',
  },
  notifIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    minWidth: 0,
  },
  notifTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  notifMessage: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  notifTime: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
  },
  miniSpinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  viewAllBtn: {
    width: '100%',
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

export default NotificationBell;
