import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SUPABASE_URL } from '../config';
import { useI18n } from '../i18n/I18nContext';
import { scrollToSection as scrollToSectionUtil } from '../utils/scrollToSection';

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
      { to: '/ambulance', labelKey: 'footer.ambulanceServices' },
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
      { to: '/ambulance', labelKey: 'footer.ambulanceServices' },
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
    icon: (
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    ),
    render: (t) => <span style={{ whiteSpace: 'pre-line' }}>{t('footer.address')}</span>,
  },
  {
    key: 'phone',
    icon: (
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    ),
    render: (t) => (
      <a href="tel:+353831257105" className="footer-popover-link">{t('footer.phoneNumber')}</a>
    ),
  },
  {
    key: 'email',
    icon: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
    render: (t) => (
      <a href="mailto:info@rodabmedical.com" className="footer-popover-link">{t('footer.emailAddress')}</a>
    ),
  },
  {
    key: 'whatsapp',
    icon: (
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    ),
    render: (t) => (
      <a href="https://wa.me/353831257105" target="_blank" rel="noopener noreferrer" className="footer-popover-link">{t('footer.whatsappNumber')}</a>
    ),
  },
  {
    key: 'hours',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={item.key === 'whatsapp' ? 'currentColor' : 'none'}
                    stroke={item.key === 'whatsapp' ? 'none' : 'currentColor'}
                    strokeWidth="2"
                    className="footer-popover-icon"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </svg>
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
