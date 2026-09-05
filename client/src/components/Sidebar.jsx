import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import { AppIcon } from './AppIcon';

export const roleConfig = {
  super_admin: {
    color: '#0b2a57',
    colorLight: '#e8eef7',
    colorHover: '#091e3d',
    label: 'Super Admin',
    alias: {
      dashboard: 'overview',
      doctors: 'overview',
      drivers: 'overview',
      reports: 'overview',
      settings: 'overview',
    },
    tabs: [
      { key: 'overview', to: '/super-admin/overview', label: 'Overview', icon: 'dashboard' },
      { key: 'admins', to: '/super-admin/admins', label: 'Admins', icon: 'users' },
      { key: 'users', to: '/super-admin/users', label: 'Users', icon: 'users' },
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
      { key: 'emergencies', to: '/emergencies', label: 'Emergencies', icon: 'emergency' },
      { key: 'prescriptions', to: '/prescriptions', label: 'Prescriptions', icon: 'prescriptions' },
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

const getIcon = (iconName, color) => (
  <AppIcon name={iconName} size={20} color={color} strokeWidth={2} />
);

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
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                transition: 'transform 0.2s',
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <AppIcon name="chevDown" size={18} color="white" strokeWidth={2} />
            </span>
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
            <span aria-hidden="true"><AppIcon name="signout" size={20} color="white" strokeWidth={2} /></span>
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
