import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_URL, LANDING_MODE } from '../config';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from './LanguageSelector';
import AccessibilityButton from './AccessibilityButton';
import { scrollToSection as scrollToSectionUtil } from '../utils/scrollToSection';

const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/appointments', labelKey: 'nav.myAppointments' },
  { to: '/consultations', labelKey: 'nav.consultations' },
  { to: '/sos', labelKey: 'nav.emergencySos' },
  { to: '/repeat-prescription', labelKey: 'nav.prescriptions' },
  { to: '/forms', labelKey: 'nav.medicalForms' },
  { to: '/events', labelKey: 'nav.events' },
  { to: '/fees', labelKey: 'nav.quickFees' },
  { to: '/faqs', labelKey: 'nav.helpCenter' },
];

const UNAUTH_NAV = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/services', labelKey: 'nav.services' },
  { to: '/find-doctor', labelKey: 'nav.findDoctor' },
  { to: '/about-us', labelKey: 'nav.aboutUs' },
  { to: '/events', labelKey: 'nav.events' },
];

const LANDING_NAV = [
  { key: 'home', section: 'home', labelKey: 'nav.home' },
  { key: 'services', section: 'services', labelKey: 'nav.services' },
  { to: '/find-doctor', labelKey: 'nav.findDoctor' },
  { key: 'about', section: 'about', labelKey: 'nav.aboutUs' },
  { to: '/events', labelKey: 'nav.events' },
];

const ROLE_NAV = {
  user: NAV_ITEMS,
  admin: [
    { to: '/admin/dashboard', labelKey: 'nav.dashboard' },
    { to: '/admin/emergency', labelKey: 'nav.emergencySos' },
  ],
  doctor: [{ to: '/doctor/dashboard', labelKey: 'nav.dashboard' }],
  driver: [{ to: '/driver/dashboard', labelKey: 'nav.dashboard' }],
  super_admin: [
    { to: '/super-admin/dashboard', labelKey: 'nav.dashboard' },
    { to: '/super-admin/emergency', labelKey: 'nav.emergencySos' },
  ],
};

const PATIENT_ROUTES = [
  '/dashboard',
  '/appointments',
  '/consultations',
  '/sos',
  '/repeat-prescription',
  '/illness-certificate',
  '/forms',
  '/form-history',
  '/fees',
  '/profile',
  '/settings',
];

const ROLE_COLORS = {
  super_admin: { bg: '#fef3c7', text: '#92400e' },
  admin: { bg: '#dbeafe', text: '#1e40af' },
  doctor: { bg: '#ede9fe', text: '#5b21b6' },
  driver: { bg: '#fff3cd', text: '#856404' },
  user: { bg: '#d1fae5', text: '#065f46' },
};

const ROLE_LABEL_KEYS = {
  super_admin: 'nav.roleSuperAdmin',
  admin: 'nav.roleAdmin',
  doctor: 'nav.roleDoctor',
  driver: 'nav.roleDriver',
  user: 'nav.roleUser',
};

const DropdownIcon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.split(',').map((seg, i) => <path key={i} d={seg.trim()} />)}
  </svg>
);

const ICONS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  ambulance: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  rx: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  forms: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M8 2h8v4H8z',
  billing: 'M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM1 10h22',
  support: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  help: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  chevDown: 'M6 9l6 6 6-6',
  signout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  policy: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  terms: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const hideTimer = useRef(null);
  const mobileSlideoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setDropdownOpen(false), 180);
  }, [clearHideTimer]);

  const handleTriggerEnter = useCallback(() => {
    clearHideTimer();
    setDropdownOpen(true);
  }, [clearHideTimer]);

  const handleTriggerLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  const handleDropdownEnter = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  const handleDropdownLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  const handleTriggerClick = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleDropdownKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !mobileSlideoutRef.current) return;

    const dialog = mobileSlideoutRef.current;
    const focusable = dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const els = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setDropdownOpen(false);
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const AvatarContent = () =>
    user?.avatar_url ? (
      <img className="avatar-img" src={user.avatar_url} alt="" />
    ) : (
      getInitials(user.full_name)
    );

  const scrollToSection = useCallback((id) => {
    setMobileOpen(false);
    setDropdownOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    scrollToSectionUtil(id);
  }, [location.pathname, navigate]);

  const navLinks = user ? (ROLE_NAV[user.role] || []) : LANDING_MODE ? LANDING_NAV : UNAUTH_NAV;
  const roleColor = user ? ROLE_COLORS[user.role] || ROLE_COLORS.user : null;

  const isPatientRoute =
    !!user &&
    user.role === 'user' &&
    PATIENT_ROUTES.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));

  const accountLinks = user ? [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: ICONS.dashboard },
    { to: '/appointments', labelKey: 'nav.myAppointments', icon: ICONS.calendar },
    { to: '/consultations', labelKey: 'nav.consultations', icon: ICONS.chat },
    { to: '/sos', labelKey: 'nav.emergencySos', icon: ICONS.ambulance },
    { to: '/repeat-prescription', labelKey: 'nav.prescriptions', icon: ICONS.rx },
    { to: '/forms', labelKey: 'nav.medicalForms', icon: ICONS.forms },
    { to: '/settings', labelKey: 'nav.profileSettings', icon: ICONS.settings },
  ] : [];

  const guestAccountLinks = [
    { labelKey: 'nav.dashboard', icon: ICONS.dashboard },
    { labelKey: 'nav.myAppointments', icon: ICONS.calendar },
    { labelKey: 'nav.consultations', icon: ICONS.chat },
    { labelKey: 'nav.emergencySos', icon: ICONS.ambulance },
    { labelKey: 'nav.prescriptions', icon: ICONS.rx },
    { labelKey: 'nav.medicalForms', icon: ICONS.forms },
    { labelKey: 'nav.profileSettings', icon: ICONS.settings },
  ];

  const isLinkActive = (link) => {
    if (link.section) return location.pathname === '/';
    return location.pathname === link.to;
  };

  return (
    <nav className="navbar-new" role="navigation" aria-label={t('nav.menuNavigation')}>
      {/* ═══ Utility Bar ═══ */}
      <div className="utility-bar">
        <div className="utility-bar-inner">
          <div className="utility-bar-left">
            <Link to="/" className="utility-bar-logo" aria-label={`${t('nav.brand')} - ${t('nav.home')}`}>
              <img
                src={`${SUPABASE_URL}/storage/v1/object/public/images/logo-footer.png`}
                alt=""
                width="30"
                height="30"
              />
              <div className="utility-bar-logo-text">
                <span className="brand-name">{t('nav.brand')}</span>
                <span className="brand-sub">{t('nav.brandSub')}</span>
              </div>
            </Link>
          </div>

          <div className="utility-bar-right">
            {/* Language Selector */}
            <LanguageSelector />

            <div className="utility-divider" />

            {/* Accessibility */}
            <AccessibilityButton />

            {/* Notifications */}
            <button className="utility-item" aria-label={t('nav.notifications')} title={t('nav.notifications')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS.bell} />
              </svg>
            </button>

            {/* Help */}
            <Link to="/faqs" className="utility-item" title={t('nav.helpCenter')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS.help} />
              </svg>
              {t('nav.help')}
            </Link>

            {/* Settings */}
            {user && (
              <Link to="/settings" className="utility-item" title={t('nav.settings')} aria-label={t('nav.settings')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICONS.settings} />
                </svg>
              </Link>
            )}

            <div className="utility-divider" />

            {/* Profile / Sign In Trigger */}
            {user ? (
              <div
                ref={dropdownRef}
                onMouseEnter={handleTriggerEnter}
                onMouseLeave={handleTriggerLeave}
                style={{ position: 'relative' }}
              >
                <button
                  className="utility-profile-trigger"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label={t('nav.userMenu')}
                  onClick={handleTriggerClick}
                  onKeyDown={(e) => { if (e.key === 'Escape') setDropdownOpen(false); }}
                >
                  <div
                    className="utility-profile-avatar"
                    style={roleColor ? { backgroundColor: roleColor.bg, color: roleColor.text } : {}}
                  >
                    <AvatarContent />
                  </div>
                  <span className="utility-profile-name">{user.full_name || t('nav.roleUser')}</span>
                  <svg className={`utility-profile-chevron ${dropdownOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="premium-dropdown"
                    role="menu"
                    aria-label={t('nav.userMenu')}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                    onKeyDown={handleDropdownKeyDown}
                  >
                    {/* User Header */}
                    <div className="premium-dropdown-user">
                      <div
                        className="avatar"
                        style={roleColor ? { backgroundColor: roleColor.bg, color: roleColor.text } : {}}
                      >
                        <AvatarContent />
                      </div>
                      <div className="info">
                        <div className="name">{user.full_name || t('nav.roleUser')}</div>
                        <div className="email">{user.email}</div>
                        <span
                          className="role-badge"
                          style={roleColor ? { backgroundColor: roleColor.bg, color: roleColor.text } : {}}
                        >
                          {t(ROLE_LABEL_KEYS[user.role] || 'nav.roleUser')}
                        </span>
                      </div>
                    </div>

                    <div className="premium-dropdown-divider" />

                    {/* My Account */}
                    <div className="premium-dropdown-section-label">{t('nav.myAccount')}</div>
                    {accountLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="premium-dropdown-link"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={link.icon} />
                        </svg>
                        {t(link.labelKey)}
                      </Link>
                    ))}

                    <div className="premium-dropdown-divider" />

                    {/* Sign Out */}
                    <button
                      className="premium-dropdown-link"
                      role="menuitem"
                      onClick={handleLogout}
                      style={{ color: 'var(--error)', width: '100%' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICONS.signout} />
                      </svg>
                      {t('nav.signOut')}
                    </button>

                    <div className="premium-dropdown-divider" />

                    {/* Footer */}
                    <div className="premium-dropdown-footer">
                      <Link to="/faqs" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.helpCenter')}</Link>
                      <Link to="/privacy-policy" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.privacyPolicy')}</Link>
                      <Link to="/policies" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.terms')}</Link>
                    </div>
                  </div>
                )}
              </div>
            ) : !LANDING_MODE && (
              <div
                ref={dropdownRef}
                onMouseEnter={handleTriggerEnter}
                onMouseLeave={handleTriggerLeave}
                style={{ position: 'relative' }}
              >
                <button
                  className="utility-profile-trigger"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label={t('nav.signInMenu')}
                  onClick={handleTriggerClick}
                  onKeyDown={(e) => { if (e.key === 'Escape') setDropdownOpen(false); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="utility-profile-name">{t('nav.signIn')}</span>
                  <svg className={`utility-profile-chevron ${dropdownOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="premium-dropdown"
                    role="menu"
                    aria-label={t('nav.signInMenu')}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                    onKeyDown={handleDropdownKeyDown}
                  >
                    {/* Auth Buttons */}
                    <div className="premium-dropdown-header">
                      <Link
                        to="/login"
                        className="premium-dropdown-auth-btn primary"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        {t('nav.signIn')}
                      </Link>
                      <Link
                        to="/signup"
                        className="premium-dropdown-auth-btn outlined"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        {t('nav.createAccount')}
                      </Link>
                    </div>

                    {/* Social Login */}
                    <div className="premium-dropdown-social">
                      <div className="premium-dropdown-social-label">{t('nav.continueWith')}</div>
                      <div className="premium-dropdown-social-row">
                        <button className="premium-dropdown-social-btn" type="button" aria-label={`${t('nav.continueWith')} Google`}>
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          {t('nav.google')}
                        </button>
                        <button className="premium-dropdown-social-btn" type="button" aria-label={`${t('nav.continueWith')} Microsoft`}>
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path d="M11.4 24H0V12.6h11.4V24z" fill="#F25022" />
                            <path d="M24 24H12.6V12.6H24V24z" fill="#00A4EF" />
                            <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#7FBA00" />
                            <path d="M24 11.4H12.6V0H24v11.4z" fill="#FFB900" />
                          </svg>
                          {t('nav.microsoft')}
                        </button>
                        <button className="premium-dropdown-social-btn" type="button" aria-label={`${t('nav.continueWith')} Apple`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                          {t('nav.apple')}
                        </button>
                      </div>
                    </div>

                    <div className="premium-dropdown-divider" />

                    {/* My Account (links to login) */}
                    <div className="premium-dropdown-section-label">{t('nav.myAccount')}</div>
                    {guestAccountLinks.map((item) => (
                      <Link
                        key={item.labelKey}
                        to="/login"
                        className="premium-dropdown-link"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={item.icon} />
                        </svg>
                        {t(item.labelKey)}
                      </Link>
                    ))}

                    <div className="premium-dropdown-divider" />

                    {/* Footer */}
                    <div className="premium-dropdown-footer">
                      <Link to="/faqs" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.helpCenter')}</Link>
                      <Link to="/privacy-policy" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.privacyPolicy')}</Link>
                      <Link to="/policies" className="premium-dropdown-footer-link" onClick={() => setDropdownOpen(false)}>{t('nav.termsAndConditions')}</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button
              className={`utility-hamburger ${mobileOpen ? 'active' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={mobileOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Main Nav ═══ */}
      <div className={`main-nav ${scrolled ? 'scrolled' : ''}${isPatientRoute ? ' patient-hidden' : ''}`}>
        <div className="main-nav-inner">
          <div className="main-nav-links" role="menubar">
            {navLinks.map((link) => (
              link.section ? (
                <button
                  key={link.key}
                  type="button"
                  className={`main-nav-link ${isLinkActive(link) ? 'active' : ''}`}
                  role="menuitem"
                  onClick={() => scrollToSection(link.section)}
                >
                  {t(link.labelKey)}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`main-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={location.pathname === link.to ? 'page' : undefined}
                >
                  {t(link.labelKey)}
                </Link>
              )
            ))}
          </div>

        </div>
      </div>

      {/* ═══ Mobile Slide-Out ═══ */}
      {mobileOpen && (
        <>
          <div className="mobile-slideout-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="mobile-slideout" role="dialog" aria-label={t('nav.menuNavigation')} ref={mobileSlideoutRef} tabIndex="-1">
            {user && (
              <div style={{ padding: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div
                    className="utility-profile-avatar"
                    style={{ width: 44, height: 44, fontSize: 16, backgroundColor: roleColor?.bg, color: roleColor?.text }}
                  >
                    <AvatarContent />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{user.full_name || t('nav.roleUser')}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{user.email}</div>
                  </div>
                </div>
              </div>
            )}

            {!user && !LANDING_MODE && (
              <>
                <div className="mobile-slideout-section-title">{t('nav.menuAccount')}</div>
                <Link to="/login" className="mobile-slideout-btn mobile-slideout-btn-primary" onClick={() => setMobileOpen(false)}>{t('nav.signIn')}</Link>
                <div style={{ height: 8 }} />
                <Link to="/signup" className="mobile-slideout-btn mobile-slideout-btn-outline" onClick={() => setMobileOpen(false)}>{t('nav.createAccount')}</Link>
              </>
            )}

            <div className="mobile-slideout-utils">
              <LanguageSelector variant="mobile" onNavigate={() => setMobileOpen(false)} />
              <AccessibilityButton variant="mobile" />
            </div>

            {navLinks.filter((link) => link.labelKey !== 'nav.dashboard').map((link) => (
              link.section ? (
                <button
                  key={link.key}
                  type="button"
                  className={`mobile-slideout-link ${isLinkActive(link) ? 'active' : ''}`}
                  onClick={() => scrollToSection(link.section)}
                >
                  {t(link.labelKey)}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`mobile-slideout-link ${location.pathname === link.to ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              )
            ))}

            {!user && (
              <>
                <div className="mobile-slideout-section-title">{t('nav.menuMore')}</div>
                <Link to="/policies" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickPolicies')}</Link>
                <Link to="/faqs" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickFaqs')}</Link>
                <Link to="/privacy-policy" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickPrivacy')}</Link>
              </>
            )}

            {user && user.role === 'user' && (
              <>
                <div className="mobile-slideout-section-title">{t('nav.menuQuickAccess')}</div>
                <Link to="/repeat-prescription" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickRepeatPrescription')}</Link>
                <Link to="/illness-certificate" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickIllnessCertificate')}</Link>
                <Link to="/fees" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickFees')}</Link>
                <Link to="/settings" className="mobile-slideout-link" onClick={() => setMobileOpen(false)}>{t('nav.quickSettings')}</Link>
              </>
            )}

            <div className="mobile-slideout-divider" />

            {user && (
              <button className="mobile-slideout-btn mobile-slideout-btn-danger" onClick={handleLogout}>{t('nav.signOut')}</button>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
