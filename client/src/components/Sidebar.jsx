import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';

const roleConfig = {
  super_admin: {
    color: '#0b2a57',
    colorLight: '#e8eef7',
    colorHover: '#091e3d',
    label: 'Super Admin',
    tabs: [
      { to: '/super-admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/super-admin/users', label: 'Users', icon: 'users' },
      { to: '/super-admin/doctors', label: 'Doctors', icon: 'doctor' },
      { to: '/super-admin/emergency', label: 'Emergency', icon: 'emergency' },
      { to: '/super-admin/drivers', label: 'Drivers', icon: 'driver' },
      { to: '/super-admin/reports', label: 'Reports', icon: 'reports' },
      { to: '/super-admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
  admin: {
    color: '#1a56db',
    colorLight: '#dbeafe',
    colorHover: '#1648b8',
    label: 'Admin',
    tabs: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/admin/appointments', label: 'Appointments', icon: 'appointments' },
      { to: '/admin/patients', label: 'Patients', icon: 'users' },
      { to: '/admin/emergency', label: 'Emergency', icon: 'emergency' },
      { to: '/admin/doctors', label: 'Doctors', icon: 'doctor' },
      { to: '/admin/reports', label: 'Reports', icon: 'reports' },
      { to: '/admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
  doctor: {
    color: '#7c3aed',
    colorLight: '#ede9fe',
    colorHover: '#6d28d9',
    label: 'Doctor',
    tabs: [
      { to: '/doctor/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/doctor/patients', label: 'My Patients', icon: 'users' },
      { to: '/doctor/consultations', label: 'Consultations', icon: 'consultations' },
      { to: '/doctor/schedule', label: 'Schedule', icon: 'schedule' },
      { to: '/doctor/prescriptions', label: 'Prescriptions', icon: 'prescriptions' },
      { to: '/doctor/reports', label: 'Reports', icon: 'reports' },
    ],
  },
  driver: {
    color: '#d97706',
    colorLight: '#fef3c7',
    colorHover: '#b45309',
    label: 'Driver',
    tabs: [
      { to: '/driver/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/driver/assignments', label: 'Assignments', icon: 'appointments' },
      { to: '/driver/history', label: 'History', icon: 'reports' },
      { to: '/driver/profile', label: 'My Profile', icon: 'settings' },
    ],
  },
};

const getIcon = (iconName, color) => {
  const iconMap = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    doctor: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    emergency: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    driver: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    appointments: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    consultations: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    schedule: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    prescriptions: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    reports: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  };
  return iconMap[iconName] || iconMap.dashboard;
};

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const config = roleConfig[user?.role] || roleConfig.admin;

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        // silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          style={styles.overlay}
          onClick={() => onToggle && onToggle()}
          onKeyDown={(e) => { if (e.key === 'Escape') onToggle && onToggle(); }}
          role="button"
          aria-label="Close sidebar"
          aria-hidden="true"
          tabIndex={0}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`sidebar${isOpen ? ' open' : ''}`}
        aria-label="Sidebar navigation"
        style={{
          backgroundColor: config.color,
          width: collapsed ? '72px' : '260px',
        }}
      >
        {/* Nav Items */}
        <nav style={styles.nav} aria-label="Dashboard navigation">
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              style={{
                transition: 'transform 0.2s',
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {config.tabs.map((tab) => {
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                style={{
                  ...styles.navItem,
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: 'white',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? tab.label : undefined}
                aria-label={collapsed ? tab.label : undefined}
              >
                <span aria-hidden="true">{getIcon(tab.icon, 'white')}</span>
                {!collapsed && (
                  <>
                    <span style={styles.navLabel}>{tab.label}</span>
                    {((tab.label === 'Emergency' || tab.label === 'Assignments') && unreadCount > 0) && (
                      <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section — Logout */}
        <div style={styles.sidebarBottom}>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            style={{
              ...styles.navItem,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg></span>
            {!collapsed && <span style={styles.navLabel}>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

const styles = {
  nav: {
    flex: 1,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  collapseToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '8px',
    marginBottom: '4px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
  navLabel: {
    flex: 1,
  },
  badge: {
    backgroundColor: '#dc2626',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
  },
  sidebarBottom: {
    padding: '8px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
};

export default Sidebar;
