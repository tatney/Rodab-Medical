import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SUPABASE_URL } from '../config';
import { useI18n } from '../i18n/I18nContext';
import { scrollToSection as scrollToSectionUtil } from '../utils/scrollToSection';
import { AppIcon } from './AppIcon';

const JUMP_LINKS = [
  {
    id: 'home',
    labelKey: 'footer.jumpHome',
    links: [
      { to: '/', labelKey: 'nav.home' },
      { to: '/about-us', labelKey: 'nav.aboutUs' },
      { to: '/services', labelKey: 'nav.services' },
      { to: '/find-doctor', labelKey: 'nav.findDoctor' },
      { to: '/events', labelKey: 'nav.events' },
      { to: '/programmes', labelKey: 'nav.programmes' },
    ],
  },
  {
    id: 'online-services',
    labelKey: 'footer.jumpOnlineServices',
    links: [
      { to: '/appointments', labelKey: 'footer.bookAppointment' },
      { to: '/repeat-prescription', labelKey: 'nav.prescriptions' },
      { to: '/consultations', labelKey: 'nav.consultations' },
      { to: '/illness-certificate', labelKey: 'nav.quickIllnessCertificate' },
      { to: '/fees', labelKey: 'nav.quickFees' },
      { to: '/sos', labelKey: 'footer.ambulanceServices' },
    ],
  },
  {
    id: 'services',
    labelKey: 'footer.jumpServices',
    links: [
      { to: '/services', labelKey: 'footer.emergencyCare' },
      { to: '/services', labelKey: 'footer.generalMedicine' },
      { to: '/services', labelKey: 'footer.cardiology' },
      { to: '/services', labelKey: 'footer.orthopaedics' },
      { to: '/sos', labelKey: 'footer.ambulanceServices' },
      { to: '/services', labelKey: 'footer.diagnostics' },
    ],
  },
  {
    id: 'about',
    labelKey: 'footer.jumpAbout',
    links: [
      { to: '/about-us', labelKey: 'nav.aboutUs' },
      { to: '/privacy-policy', labelKey: 'nav.quickPrivacy' },
      { to: '/policies', labelKey: 'nav.quickPolicies' },
      { to: '/faqs', labelKey: 'nav.quickFaqs' },
    ],
  },
  {
    id: 'testimonials',
    labelKey: 'footer.jumpTestimonials',
    links: [
      { section: 'testimonials', labelKey: 'footer.jumpTestimonials' },
      { to: '/events', labelKey: 'nav.events' },
    ],
  },
  { id: 'contact', labelKey: 'footer.contactUs', contact: true },
];

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    stroke: true,
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <>
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
];

const CONTACT_ITEMS = [
  {
    key: 'address',
    iconName: 'map-pin',
    render: (t) => <span style={{ whiteSpace: 'pre-line' }}>{t('footer.address')}</span>,
  },
  {
    key: 'phone',
    iconName: 'phone',
    render: (t) => (
      <a href="tel:+353831257105" className="footer-popover-link">{t('footer.phoneNumber')}</a>
    ),
  },
  {
    key: 'email',
    iconName: 'mail',
    render: (t) => (
      <a href="mailto:info@rodabmedical.com" className="footer-popover-link">{t('footer.emailAddress')}</a>
    ),
  },
  {
    key: 'whatsapp',
    iconName: 'message-circle',
    render: (t) => (
      <a href="https://wa.me/353831257105" target="_blank" rel="noopener noreferrer" className="footer-popover-link">{t('footer.whatsappNumber')}</a>
    ),
  },
  {
    key: 'hours',
    iconName: 'clock',
    render: (t) => <span>{t('footer.emergencyHours')}</span>,
  },
];

const PANEL_GAP = 8;
const PANEL_WIDTH = 320;

const computePanelPosition = (button) => {
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(PANEL_WIDTH, vw - 32);

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(16, Math.min(left, vw - width - 16));

  let top = rect.bottom + PANEL_GAP;
  let maxHeight = vh - top - 16;
  if (maxHeight < 180) {
    top = Math.max(16, rect.top - 180 - PANEL_GAP);
    maxHeight = Math.min(560, rect.top - PANEL_GAP - 16);
  }
  maxHeight = Math.max(120, Math.min(560, maxHeight));

  return { top, left, width, maxHeight };
};

const JumpDropdown = ({ id, label, jump, scrollToSection, t }) => {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => setPanelPos(computePanelPosition(buttonRef.current));
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [open]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setPanelPos(computePanelPosition(buttonRef.current));
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} style={styles.dropdownWrapper}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="footer-jump-btn"
        style={styles.jumpBtn}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
      >
        {label}
      </button>
      {open && (
        <div
          id={id}
          className="footer-dropdown"
          role={jump.contact ? 'dialog' : 'list'}
          aria-label={label}
          style={
            panelPos
              ? {
                  position: 'fixed',
                  top: panelPos.top,
                  left: panelPos.left,
                  width: panelPos.width,
                  maxHeight: panelPos.maxHeight,
                  transform: 'none',
                }
              : undefined
          }
        >
          {jump.contact
            ? CONTACT_ITEMS.map((item) => (
                <div key={item.key} className="footer-popover-item">
                  <AppIcon name={item.iconName} size={16} className="footer-popover-icon" />
                  <span>{item.render(t)}</span>
                </div>
              ))
            : jump.links.map((link, index) => (
                <div key={`${link.to || link.section}-${index}`} className="footer-dropdown-item" role="listitem">
                  {link.section ? (
                    <button
                      type="button"
                      className="footer-dropdown-link footer-dropdown-btn"
                      onClick={() => {
                        setOpen(false);
                        scrollToSection(link.section);
                      }}
                    >
                      {t(link.labelKey)}
                    </button>
                  ) : (
                    <Link
                      to={link.to}
                      className="footer-dropdown-link"
                      onClick={() => setOpen(false)}
                    >
                      {t(link.labelKey)}
                    </Link>
                  )}
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

const Footer = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    scrollToSectionUtil(id);
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Brand Section - Full Width */}
        <div className="footer-brand-section">
          <div style={styles.logoIcon}>
            <img
              src={`${SUPABASE_URL}/storage/v1/object/public/images/logo-footer.png`}
              alt="Rodab Medical"
              style={{ height: 24, width: 'auto' }}
            />
          </div>
          <div className="footer-brand-text">
            <h4>{t('nav.brand')}</h4>
            <div className="subtext">{t('footer.brandSub')}</div>
            <p>{t('footer.aboutText')}</p>
          </div>
        </div>

        {/* Quick Jump - navigation dropdowns */}
        <div style={styles.jumpSection}>
          <div style={styles.jumpRow}>
            {JUMP_LINKS.map((jump) => (
              <JumpDropdown
                key={jump.id}
                id={`footer-dropdown-${jump.id}`}
                label={t(jump.labelKey)}
                jump={jump}
                scrollToSection={scrollToSection}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="footer-social-section">
          <div className="footer-social-links">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                aria-label={social.name}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={social.stroke ? 'none' : 'currentColor'}
                  stroke={social.stroke ? 'currentColor' : 'none'}
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  {social.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p style={styles.copyright}>
            &copy; {currentYear} {t('footer.copyright')}
          </p>
          <div style={styles.bottomLinks}>
            <Link to="/privacy-policy" style={styles.bottomLink}>{t('footer.privacyPolicy')}</Link>
            <Link to="/policies" style={styles.bottomLink}>{t('footer.termsOfService')}</Link>
            <Link to="/privacy-policy" style={styles.bottomLink}>{t('footer.cookiePolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: 'var(--brand-bg)',
    color: '#cbd5e1',
    paddingTop: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '20px',
    position: 'relative',
    paddingBottom: '10px',
  },
  jumpSection: {
    marginBottom: '40px',
  },
  jumpRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  dropdownWrapper: {
    position: 'relative',
  },
  jumpBtn: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    minHeight: '44px',
  },
  copyright: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    textAlign: 'center',
  },
  bottomLinks: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  bottomLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default Footer;
