import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';

export const roleConfig = {
  super_admin: {
    color: '#0b2a57',
    colorLight: '#e8eef7',
    colorHover: '#091e3d',
    label: 'Super Admin',
    alias: {
      dashboard: 'overview',
      users: 'admins',
      doctors: 'overview',
      drivers: 'overview',
      reports: 'overview',
      settings: 'overview',
    },
    tabs: [
      { key: 'overview', to: '/super-admin/overview', label: 'Overview', icon: 'dashboard' },
      { key: 'admins', to: '/super-admin/admins', label: 'Admins', icon: 'users' },
      { key: 'hospitals', to: '/super-admin/hospitals', label: 'Hospitals', icon: 'hospital' },
      { key: 'emergency', to: '/super-admin/emergency', label: 'Emergency', icon: 'emergency', badge: true },
      { key: 'news', to: '/super-admin/news', label: 'News & Blogs', icon: 'news' },
      { key: 'programmes', to: '/super-admin/programmes', label: 'Programmes', icon: 'programmes' },
      { key: 'partners', to: '/super-admin/partners', label: 'Partners', icon: 'partners' },
      { key: 'logs', to: '/super-admin/logs', label: 'Logs', icon: 'logs' },
    ],
  },
  admin: {
    color: '#1a56db',
    colorLight: '#dbeafe',
    colorHover: '#1648b8',
    label: 'Admin',
    alias: {
      dashboard: 'overview',
      patients: 'records',
      reports: 'overview',
      settings: 'overview',
    },
    tabs: [
      { key: 'overview', to: '/admin/overview', label: 'Overview', icon: 'dashboard' },
      { key: 'admins', to: '/admin/admins', label: 'Admins', icon: 'users' },
      { key: 'departments', to: '/admin/departments', label: 'Departments', icon: 'departments' },
      { key: 'doctors', to: '/admin/doctors', label: 'Doctors', icon: 'doctor' },
      { key: 'availability', to: '/admin/availability', label: 'Availability', icon: 'availability' },
      { key: 'hospitals', to: '/admin/hospitals', label: 'Hospitals', icon: 'hospital' },
      { key: 'vehicles', to: '/admin/vehicles', label: 'Vehicles', icon: 'vehicles' },
      { key: 'drivers', to: '/admin/drivers', label: 'Drivers', icon: 'driver' },
      { key: 'emergency', to: '/admin/emergency', label: 'Emergency', icon: 'emergency', badge: true },
      { key: 'fees', to: '/admin/fees', label: 'Fees', icon: 'fees' },
      { key: 'forms', to: '/admin/forms', label: 'Forms', icon: 'forms' },
      { key: 'records', to: '/admin/records', label: 'Patients / Records', icon: 'records' },
      { key: 'notifications', to: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
      { key: 'messages', to: '/admin/messages', label: 'Messages', icon: 'messages' },
      { key: 'prescriptions', to: '/admin/prescriptions', label: 'Prescriptions', icon: 'prescriptions' },
      { key: 'certificates', to: '/admin/certificates', label: 'Certificates', icon: 'certificates' },
      { key: 'appointments', to: '/admin/appointments', label: 'Appointments', icon: 'appointments' },
      { key: 'consultations', to: '/admin/consultations', label: 'Consultations', icon: 'consultations' },
    ],
  },
  doctor: {
    color: '#7c3aed',
    colorLight: '#ede9fe',
    colorHover: '#6d28d9',
    label: 'Doctor',
    alias: {
      schedule: 'availability',
      prescriptions: 'dashboard',
      reports: 'dashboard',
    },
    tabs: [
      { key: 'dashboard', to: '/doctor/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { key: 'patients', to: '/doctor/patients', label: 'Patients', icon: 'users' },
      { key: 'appointments', to: '/doctor/appointments', label: 'Appointments', icon: 'appointments' },
      { key: 'availability', to: '/doctor/availability', label: 'Availability', icon: 'availability' },
      { key: 'consultations', to: '/doctor/consultations', label: 'Consultations', icon: 'consultations' },
    ],
  },
  driver: {
    color: '#d97706',
    colorLight: '#fef3c7',
    colorHover: '#b45309',
    label: 'Driver',
    alias: {
      dashboard: 'rides',
      assignments: 'rides',
      history: 'rides',
      profile: 'rides',
    },
    tabs: [
      { key: 'rides', to: '/driver/rides', label: 'Rides', icon: 'rides', badge: true },
      { key: 'map', to: '/driver/map', label: 'Map', icon: 'map' },
      { key: 'alerts', to: '/driver/alerts', label: 'Alerts', icon: 'alerts' },
    ],
  },
  user: {
    color: '#0f766e',
    colorLight: '#ccfbf1',
    colorHover: '#115e59',
    label: 'Patient',
    alias: {},
    tabs: [
      { key: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { key: 'appointments', to: '/appointments', label: 'Appointments', icon: 'appointments' },
      { key: 'consultations', to: '/consultations', label: 'Consultations', icon: 'consultations' },
      { key: 'ambulance', to: '/ambulance', label: 'Ambulance', icon: 'ambulance' },
      { key: 'repeat-prescription', to: '/repeat-prescription', label: 'Repeat Prescription', icon: 'repeat-prescription' },
      { key: 'illness-certificate', to: '/illness-certificate', label: 'Illness Certificate', icon: 'certificates' },
      { key: 'forms', to: '/forms', label: 'Medical Forms', icon: 'forms' },
      { key: 'form-history', to: '/form-history', label: 'Form History', icon: 'records' },
      { key: 'fees', to: '/fees', label: 'Quick Fees', icon: 'fees' },
      { key: 'profile', to: '/profile', label: 'My Profile', icon: 'profile' },
      { key: 'settings', to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
};

export const getRoleConfig = (role) => roleConfig[role] || roleConfig.user;

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
    availability: (
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
    events: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M3 11l18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
      </svg>
    ),
    news: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    programmes: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" />
      </svg>
    ),
    partners: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M12.5 15.2c.8-.2 1.6-.2 2.5-.2 3.3 0 6 2.7 6 6" />
      </svg>
    ),
    logs: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
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
    hospital: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M8 21v-6h8v6M12 6v6M9 9h6" />
      </svg>
    ),
    departments: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M8 21v-6h8v6" />
      </svg>
    ),
    vehicles: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    rides: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    ambulance: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    'repeat-prescription': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    fees: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
    forms: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </svg>
    ),
    records: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    notifications: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    messages: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    certificates: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="6" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
    ),
    map: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
    alerts: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    profile: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };
  return iconMap[iconName] || iconMap.dashboard;
};

const Sidebar = ({ isOpen, onToggle, topOffset }) => {
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

  const currentSegment = location.pathname.split('/').filter(Boolean).pop() || '';
  const currentKey = (config.alias && config.alias[currentSegment]) || currentSegment;

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
          ...(topOffset != null ? { '--sidebar-top-offset': `${topOffset}px` } : {}),
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
            const active = tab.key === currentKey;
            return (
              <Link
                key={tab.key}
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
                    {(tab.badge && unreadCount > 0) && (
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
    overflowY: 'auto',
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
    flexShrink: 0,
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
    flexShrink: 0,
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
    flexShrink: 0,
  },
};

export default Sidebar;
